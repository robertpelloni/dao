import { TreasuryManager } from '../src/core/treasury';
import { Store } from '../src/models/Store';
import { Proposal, Contribution } from '../src/models/types';

describe('TreasuryManager and QF Engine', () => {
  let treasury: TreasuryManager;
  let store: Store;

  beforeEach(() => {
    store = new Store();
    treasury = new TreasuryManager(store);
  });

  test('should intake funds and allocate to matching pool correctly for multiple tokens', () => {
    treasury.intakeFunds(1000, 'ETH');
    expect(treasury.getTreasuryBalance('ETH')).toBe(1000);
    expect(treasury.getPoolBalance('ETH')).toBe(0);

    const success = treasury.allocateToMatchingPool(400, 'ETH');
    expect(success).toBe(true);
    expect(treasury.getTreasuryBalance('ETH')).toBe(600);
    expect(treasury.getPoolBalance('ETH')).toBe(400);

    // Fail if over-allocated
    const fail = treasury.allocateToMatchingPool(1000, 'ETH');
    expect(fail).toBe(false);
  });

  test('calculateMatch computes QF correctly', () => {
    const contributions: Contribution[] = [
      { userId: 'u1', proposalId: 'p1', amount: 100, tokenSymbol: 'USD', timestamp: 0 },
      { userId: 'u2', proposalId: 'p1', amount: 100, tokenSymbol: 'USD', timestamp: 0 }
    ];
    // Sqrt(100) + Sqrt(100) = 10 + 10 = 20
    // QF Value = 20^2 = 400
    // Match = 400 - (100 + 100) = 200
    expect(treasury.calculateMatch(contributions)).toBe(200);
  });

  test('allocateMatchingFunds scales when pool is insufficient', () => {
    treasury.setMatchingPool(100, 'USD');

    const p1: Proposal = { id: 'p1', tokenSymbol: 'USD' } as any;
    const p2: Proposal = { id: 'p2', tokenSymbol: 'USD' } as any;

    const allContributions = new Map<string, Contribution[]>();
    allContributions.set('p1', [
      { userId: 'u1', proposalId: 'p1', amount: 100, tokenSymbol: 'USD', timestamp: 0 },
      { userId: 'u2', proposalId: 'p1', amount: 100, tokenSymbol: 'USD', timestamp: 0 }
    ]); // Match = 200

    allContributions.set('p2', [
      { userId: 'u3', proposalId: 'p2', amount: 100, tokenSymbol: 'USD', timestamp: 0 },
      { userId: 'u4', proposalId: 'p2', amount: 100, tokenSymbol: 'USD', timestamp: 0 }
    ]); // Match = 200

    // Total required = 400. Pool = 100. Scale = 0.25
    const matches = treasury.allocateMatchingFunds([p1, p2], allContributions, 'USD');

    expect(matches['p1']).toBe(50);
    expect(matches['p2']).toBe(50);
  });
});
