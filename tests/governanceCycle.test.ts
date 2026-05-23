import { Store } from '../src/models/Store';
import { GovernanceManager } from '../src/core/governanceCycle';

describe('Governance Cycle Management', () => {
  let store: Store;
  let manager: GovernanceManager;

  beforeEach(() => {
    store = new Store(':memory:');
    manager = new GovernanceManager(store);
  });

  it('should initialize the first cycle', () => {
    const cycle = manager.initialize();
    expect(cycle.number).toBe(1);
    expect(cycle.status).toBe('ACTIVE');


    const stored = store.getCurrentCycle();
    expect(stored?.id).toBe(cycle.id);
  });

  it('should transition to the next cycle', () => {
    manager.initialize();
    const next = manager.transitionCycle();

    expect(next.number).toBe(2);
    expect(next.status).toBe('ACTIVE');


    expect(next.number).toBe(2);
    expect(next.status).toBe('ACTIVE');

    const cycles = store.getCycles();
    expect(cycles.length).toBe(2);
    expect(cycles.find(c => c.number === 1)?.status).toBe('ARCHIVED');
  });

  it('should apply reputation decay on transition', () => {
    store.addUser({
      id: 'u1',
      name: 'Expert',
      voiceCredits: 100,
      reputation: { 'Engineering': 100 },
      delegates: {}
    });

    manager.initialize();
    manager.transitionCycle();

    const user = store.getUser('u1');
    expect(user?.reputation['Engineering']).toBe(90);
  });

  it('should refresh voice credits on transition', () => {
    store.addUser({
      id: 'u2',
      name: 'Voter',
      voiceCredits: 20,
      reputation: {},
      delegates: {}
    });

    manager.initialize();
    manager.transitionCycle();

    const user = store.getUser('u2');
    expect(user?.voiceCredits).toBe(100);
  });
});
