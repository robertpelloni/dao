import { Store } from '../src/models/Store';
import { TreasuryManager } from '../src/core/treasury';

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
