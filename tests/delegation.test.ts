import { Store } from '../src/models/Store';
import { resolveDelegate, calculateEffectivePower, delegate, revokeDelegation } from '../src/core/delegation';
import { User } from '../src/models/types';

describe('Liquid Delegation Logic', () => {
  let store: Store;

  beforeEach(() => {
    store = new Store();
    const users: User[] = [
      { id: 'A', name: 'Alice', voiceCredits: 100, reputation: {}, delegates: {} },
      { id: 'B', name: 'Bob', voiceCredits: 100, reputation: {}, delegates: {} },
      { id: 'C', name: 'Charlie', voiceCredits: 100, reputation: {}, delegates: {} },
      { id: 'D', name: 'Dave', voiceCredits: 100, reputation: {}, delegates: {} },
    ];
    users.forEach(u => store.addUser(u));
  });

  test('resolveDelegate should return the user themselves if no delegation', () => {
    expect(resolveDelegate(store, 'A', 'Roads')).toBe('A');
  });

  test('resolveDelegate should handle direct delegation', () => {
    delegate(store, 'A', 'B', 'Roads');
    expect(resolveDelegate(store, 'A', 'Roads')).toBe('B');
  });

  test('resolveDelegate should handle transitive delegation (A -> B -> C)', () => {
    delegate(store, 'A', 'B', 'Roads');
    delegate(store, 'B', 'C', 'Roads');
    expect(resolveDelegate(store, 'A', 'Roads')).toBe('C');
  });

  test('resolveDelegate should handle circular delegation (A -> B -> A)', () => {
    delegate(store, 'A', 'B', 'Roads');
    delegate(store, 'B', 'A', 'Roads');
    // Chain breaks at circularity
    expect(resolveDelegate(store, 'A', 'Roads')).toBe('A');
    expect(resolveDelegate(store, 'B', 'Roads')).toBe('B');
  });

  test('calculateEffectivePower should sum credits from delegators', () => {
    delegate(store, 'A', 'B', 'Roads');
    delegate(store, 'C', 'B', 'Roads');

    // B should have A's (100) + C's (100) + their own (100) = 300
    expect(calculateEffectivePower(store, 'B', 'Roads')).toBe(300);
    // A and C should have 0 because they delegated away
    expect(calculateEffectivePower(store, 'A', 'Roads')).toBe(0);
  });

  test('calculateEffectivePower should handle transitive chains (A -> B -> C)', () => {
    delegate(store, 'A', 'B', 'Roads');
    delegate(store, 'B', 'C', 'Roads');

    // C should have A + B + C = 300
    expect(calculateEffectivePower(store, 'C', 'Roads')).toBe(300);
    expect(calculateEffectivePower(store, 'B', 'Roads')).toBe(0);
    expect(calculateEffectivePower(store, 'A', 'Roads')).toBe(0);
  });

  test('revokeDelegation should restore power to the delegator', () => {
    delegate(store, 'A', 'B', 'Roads');
    expect(calculateEffectivePower(store, 'B', 'Roads')).toBe(200);

    revokeDelegation(store, 'A', 'Roads');
    expect(calculateEffectivePower(store, 'B', 'Roads')).toBe(100);
    expect(calculateEffectivePower(store, 'A', 'Roads')).toBe(100);
  });

  test('delegation should be subject-specific', () => {
    delegate(store, 'A', 'B', 'Roads');
    delegate(store, 'A', 'C', 'Parks');

    expect(resolveDelegate(store, 'A', 'Roads')).toBe('B');
    expect(resolveDelegate(store, 'A', 'Parks')).toBe('C');
  });
});
