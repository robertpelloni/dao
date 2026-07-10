import { Store } from '../src/models/Store';
import { TreasuryManager } from '../src/core/treasury';
import { CrowdfundingEngine } from '../src/core/crowdfunding';
import { Proposal } from '../src/models/types';

describe('Treasury & Voluntary Tax Integration', () => {
  let store: Store;
  let treasury: TreasuryManager;
  let crowdfunding: CrowdfundingEngine;

  beforeEach(() => {
    store = new Store(':memory:');
    crowdfunding = new CrowdfundingEngine(store);
    treasury = crowdfunding.getTreasury();
  });

  test('Persistent Matching Pool Management', () => {
    treasury.setMatchingPool(1000, 'USD', 'Infrastructure');
    expect(treasury.getPoolBalance('USD', 'Infrastructure')).toBe(1000);

    const pools = treasury.getAllPools();
    expect(pools.find(p => p.subject === 'Infrastructure')?.amount).toBe(1000);
  });

  test('Voluntary Contribution (Deposit) with Subject Routing', () => {
    treasury.deposit(500, 'USD', 'Infrastructure', 'Citizen Donation');
    expect(treasury.getPoolBalance('USD', 'Infrastructure')).toBe(500);

    const txs = treasury.getTransactions();
    expect(txs.length).toBe(1);
    expect(txs[0].amount).toBe(500);
    expect(txs[0].subject).toBe('Infrastructure');
    expect(txs[0].description).toBe('Citizen Donation');
  });

  test('Stake-based Reputation for Contribution', () => {
    store.addUser({ id: 'alice', name: 'Alice', voiceCredits: 100, reputation: {}, delegates: {} });
    treasury.deposit(100, 'USD', 'Education', 'School funding', 'alice');

    const user = store.getUser('alice');
    expect(user?.reputation['Education']).toBe(10);

    const txs = treasury.getTransactions();
    expect(txs[0].userId).toBe('alice');
  });

  test('Automated Match Allocation during Finalization with Subject Routing', () => {
    // 1. Setup matching pools
    treasury.deposit(2000, 'USD', 'Infrastructure', 'Initial Pool');
    treasury.deposit(5000, 'USD', 'General', 'Global Pool');

    // 2. Create proposal tied to Infrastructure
    store.addCommittee({ id: 'infra-comm', subject: 'Infrastructure', members: [], thresholdQuorum: 0.05 });
    const proposal: Proposal = {
      id: 'prop-1',
      title: 'Road Repair',
      abstract: 'Fixing potholes',
      detailedSpecs: '...',
      proposerId: 'bob',
      committeeId: 'infra-comm',
      status: 'ACTIVE_VOTING',
      milestones: [],
      totalTargetBudget: 100,
      currentFunding: 100,
      tokenSymbol: 'USD',
      votesFor: 10,
      votesAgainst: 0,
      executionPayload: '{}'
    };
    store.addProposal(proposal);

    // 3. Add contribution
    store.addContribution({
      userId: 'alice',
      proposalId: 'prop-1',
      amount: 100,
      tokenSymbol: 'USD',
      timestamp: Date.now()
    });

    // QF Match for $100 from 1 person is (sqrt(100))^2 - 100 = 0.
    // Let's add more people to get a match.
    store.addContribution({
      userId: 'charlie',
      proposalId: 'prop-1',
      amount: 100,
      tokenSymbol: 'USD',
      timestamp: Date.now()
    });
    // Match = (sqrt(100) + sqrt(100))^2 - 200 = (10+10)^2 - 200 = 400 - 200 = 200.

    // 4. Finalize
    crowdfunding.finalizeFunding('prop-1');

    // 5. Verify match was allocated
    const updated = store.getProposal('prop-1');
    // currentFunding was 100 (original) + 200 (match) = 300?
    // Wait, contribute() updates store.currentFunding.
    // In this test I manually added contributions to store but didn't update proposal.currentFunding.
    // CrowdfundingEngine.finalizeFunding uses store.getContributionsByProposal.

    // Let's re-run with proper setup
    store.clear();
    store.addCommittee({ id: 'infra-comm', subject: 'Infrastructure', members: [], thresholdQuorum: 0.05 });
    treasury.deposit(2000, 'USD', 'Infrastructure', 'Initial Pool');
    store.addProposal(proposal);
    crowdfunding.contribute('alice', 'prop-1', 100);
    crowdfunding.contribute('charlie', 'prop-1', 100);

    crowdfunding.finalizeFunding('prop-1');

    const finalProp = store.getProposal('prop-1');
    // contributions: 100 + 100 = 200
    // match: (sqrt(100) + sqrt(100))^2 - 200 = 200
    // total: 100 (initial) + 200 (contribs) + 200 (match) = 500
    expect(finalProp?.currentFunding).toBe(500);
    expect(treasury.getPoolBalance('USD', 'Infrastructure')).toBe(1800); // 2000 - 200

    // Verification of transaction log
    const txs = treasury.getTransactions();
    expect(txs.some(t => t.type === 'MATCH_ALLOCATION')).toBe(true);
  });
});
