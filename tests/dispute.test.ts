import { Store } from '../src/models/Store';
import { CrowdfundingEngine } from '../src/core/crowdfunding';
import { Proposal } from '../src/models/types';

describe('Milestone Dispute & Slashing', () => {
  let store: Store;
  let crowdfunding: CrowdfundingEngine;

  beforeEach(() => {
    store = new Store(':memory:');
    crowdfunding = new CrowdfundingEngine(store);
  });

  test('Milestone Rejection triggers Dispute state and Slashing', () => {
    // 1. Setup users
    store.addUser({ id: 'proposer', name: 'Proposer', voiceCredits: 100, reputation: { 'General': 50 }, delegates: {} });
    store.addUser({ id: 'expert', name: 'Expert', voiceCredits: 100, reputation: { 'General': 10 }, delegates: {} });
    store.addUser({ id: 'noob', name: 'Noob', voiceCredits: 100, reputation: { 'General': 0 }, delegates: {} });

    // 2. Setup proposal
    const proposal: Proposal = {
      id: 'prop-1',
      title: 'Test Project',
      abstract: '...',
      detailedSpecs: '...',
      proposerId: 'proposer',
      committeeId: 'comm-1',
      status: 'FUNDED',
      milestones: [{ id: 'm1', description: 'Step 1', targetBudget: 100, isCompleted: false, assignedJury: ['expert', 'noob'], requiredJuryQuorum: 2 }],
      totalTargetBudget: 100,
      currentFunding: 100,
      tokenSymbol: 'USD',
      votesFor: 0,
      votesAgainst: 0,
      executionPayload: '{}'
    };
    store.addCommittee({ id: 'comm-1', subject: 'General', members: [], thresholdQuorum: 0.05 });
    store.addProposal(proposal);

    // 3. Expert rejects (weighted score = 2)
    crowdfunding.voteOnMilestone('prop-1', 'm1', 'expert', 'REJECT');

    // 4. Verify state
    const updated = store.getProposal('prop-1');
    const milestone = updated?.milestones[0];
    expect(milestone?.isDisputed).toBe(true);
    expect(milestone?.isCompleted).toBe(false);

    // 5. Verify Slashing
    const proposer = store.getUser('proposer');
    expect(proposer?.reputation['General']).toBe(40); // 50 - 10
  });
});
