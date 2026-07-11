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

describe('TreasuryManager', () => {
  let store: Store;
  let treasury: TreasuryManager;

  beforeEach(() => {
    store = new Store(':memory:');
    treasury = new TreasuryManager(store);
  });

  test('should initialize with default USD pool', () => {
    expect(treasury.getPoolBalance('USD')).toBe(0);
  });

  test('should set and get pool balance', () => {
    treasury.setMatchingPool(1000, 'USD');
    expect(treasury.getPoolBalance('USD')).toBe(1000);

    treasury.setMatchingPool(500, 'ETH');
    expect(treasury.getPoolBalance('ETH')).toBe(500);
  });

  test('should calculate QF match correctly', () => {
    const contributions = [
      { userId: 'u1', proposalId: 'p1', amount: 100, tokenSymbol: 'USD', timestamp: 123 },
      { userId: 'u2', proposalId: 'p1', amount: 100, tokenSymbol: 'USD', timestamp: 124 }
    ];
    // (sqrt(100) + sqrt(100))^2 - (100 + 100)
    // (10 + 10)^2 - 200 = 400 - 200 = 200
    const match = treasury.calculateMatch(contributions);
    expect(match).toBe(200);
  });

  test('should handle deposits and track transactions', () => {
    treasury.deposit(100, 'USD', 'Initial test deposit');
    expect(treasury.getPoolBalance('USD')).toBe(100);

    const txs = treasury.getTransactions();
    expect(txs.length).toBe(1);
    expect(txs[0].amount).toBe(100);
    expect(txs[0].type).toBe('DEPOSIT');
    expect(txs[0].description).toBe('Initial test deposit');
  });

  test('should allocate matching funds proportionally if pool is exceeded', () => {
    treasury.setMatchingPool(100, 'USD');

    const proposals = [
      { id: 'p1', tokenSymbol: 'USD' } as any,
      { id: 'p2', tokenSymbol: 'USD' } as any
    ];

    const allContributions = new Map();
    // p1: match 200
    allContributions.set('p1', [
      { amount: 100 }, { amount: 100 }
    ]);
    // p2: match 200
    allContributions.set('p2', [
      { amount: 100 }, { amount: 100 }
    ]);

    const matches = treasury.allocateMatchingFunds(proposals, allContributions, 'USD');

    // Total required 400, pool 100. Scale = 0.25
    expect(matches['p1']).toBe(50);
    expect(matches['p2']).toBe(50);
  });
});
