import { Store } from '../src/models/Store';
import { globalIdentity } from '../src/core/identity';
import { globalStore } from '../src/models/Store';


import { CrowdfundingEngine } from '../src/core/crowdfunding';
import { transitionProposal } from '../src/core/proposalStateMachine';
import { SecurityEngine } from '../src/core/security';
import { NetworkInterface, GlobalNetworkManager } from '../src/core/protocol/network';

describe('Phase 10: Production Hardening & Live Simulation End-to-End', () => {
  let store: Store;
  let crowdfunding: CrowdfundingEngine;

  let security: SecurityEngine;


  beforeEach(() => {
    // In-memory isolated store for clean E2E test
    store = globalStore; store.clear();
    crowdfunding = new CrowdfundingEngine(store);

    security = new SecurityEngine(store);


    // Setup initial state
    store.addUser({
      id: 'alice',
      name: 'Alice (Proposer)',
      voiceCredits: 100,
      reputation: { General: 50 },
      delegates: {}
    });

    store.addUser({
      id: 'bob',
      name: 'Bob (Funder)',
      voiceCredits: 100,
      reputation: { General: 20 },
      delegates: {}
    });

    store.addUser({
      id: 'charlie',
      name: 'Charlie (Jury)',
      voiceCredits: 100,
      reputation: { General: 30 },
      delegates: {}
    });

    // Sybil net for security test
    for (let i = 1; i <= 6; i++) {
        store.addUser({
            id: `sybil_${i}`,
            name: `Sybil ${i}`,
            voiceCredits: 0,
            reputation: { General: 1 }, // Low rep
            delegates: { 'General': 'bob' } // Funneling to Bob
        });
    }

    // Verify humans (simulating JWT/ZKP check passage)
    globalIdentity.verifyManually('alice');
    globalIdentity.verifyManually('bob');
    globalIdentity.verifyManually('charlie');
  });

  afterEach(() => {
      store.clear();
  });

  it('Full E2E: Proposal Creation -> Multi-token Funding -> Sybil Check -> Milestone Payout', async () => {
    // 1. Identity & Sybil Check
    const sybils = security.detectSybilClusters();
    // Bob should be flagged as a Sybil sink because 6 low-rep users delegated to him
    expect(sybils).toContain('bob');

    // Simulate setting flagged flag via API/admin
    const profile = globalIdentity.getProfile('bob');
    if (profile) profile.flaggedAsSybil = true;

    // 2. Proposal Creation
    const proposalId = 'e2e-prop-1';
    store.addProposal({
      id: proposalId,
      title: 'Decentralized Water Filter',
      abstract: 'Testing E2E',
      detailedSpecs: '...',
      proposerId: 'alice',
      committeeId: 'env-committee',
      status: 'ACTIVE_VOTING', // Skip straight to voting/funding
      milestones: [
        { id: 'm1', description: 'Design', targetBudget: 1000, isCompleted: false },
        { id: 'm2', description: 'Build', targetBudget: 4000, isCompleted: false }
      ],
      totalTargetBudget: 5000,
      currentFunding: 0,
      tokenSymbol: 'USD',
      votesFor: 100,
      votesAgainst: 0,
      executionPayload: '{}'
    });

    // 3. Multi-token Funding
    // Alice contributes 1 ETH (simulated ExchangeRateOracle = 3000 USD)
    crowdfunding.contribute('alice', proposalId, 1, 'ETH');

    // Charlie contributes 2000 USDC
    crowdfunding.contribute('charlie', proposalId, 2000, 'USDC');

    // Bob tries to contribute, but he's flagged. In a real controller, this would be blocked.
    // For test simulation, we'll assume the controller blocked it and skip Bob's contribution.

    const propAfterFunding = store.getProposal(proposalId);
    expect(propAfterFunding?.currentFunding).toBe(5000); // 3000 (1 ETH) + 2000 (USDC)

    // 4. Finalize Funding (State Machine integration)
    // Setup a matching pool of 5000 USD
    crowdfunding.getTreasury().setMatchingPool(5000, 'USD');
    const isFunded = crowdfunding.finalizeFunding(proposalId);

    expect(isFunded).toBe(true);
    const propFunded = store.getProposal(proposalId);
    expect(propFunded?.status).toBe('FUNDED');

    // Check quadratic matching applied
    // Alice (3000) -> sqrt is ~54.77
    // Charlie (2000) -> sqrt is ~44.72
    // Sum = ~99.49. Square = ~9900.
    // Match = 9900 - 5000 = 4900.
    // actualMatch caps at poolBalance (5000).
    expect(propFunded?.currentFunding).toBeGreaterThan(5000);

    // 5. Milestone Voting & Payout
    // We assume 'charlie' was assigned to the jury during finalizeFunding (since he is verified)
    // Force assign charlie for predictable testing
    if (propFunded) {
        if (propFunded.milestones[0]) propFunded.milestones[0].assignedJury = ['charlie'];
        store.updateProposal(proposalId, { milestones: propFunded.milestones });
    }

    crowdfunding.voteOnMilestone(proposalId, 'm1', 'charlie');

    const propInProgress = store.getProposal(proposalId);
    expect(propInProgress?.status).toBe('IN_PROGRESS');
    expect(propInProgress?.milestones[0]?.isCompleted).toBe(true);

    // Validate reputation reward for completing milestone
    const aliceUser = store.getUser('alice');
    expect(aliceUser?.reputation?.['General']).toBe(55); // 50 + 5 reward
  });
});
