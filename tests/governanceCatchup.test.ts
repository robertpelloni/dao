import { Store } from '../src/models/Store';
import { GovernanceManager } from '../src/core/governanceCycle';

describe('Governance Cycle Multi-Year Catch-up', () => {
  let store: Store;
  let manager: GovernanceManager;

  beforeEach(() => {
    store = new Store(':memory:');
    manager = new GovernanceManager(store);
  });

  it('should catch up multiple cycles if system was offline', () => {
    const now = Date.now();
    const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000) - 1000;


    // Manually inject an expired cycle 1
    store.addCycle({
      id: 'cycle-1',
      number: 1,
      startTime: sixtyDaysAgo,
      endTime: sixtyDaysAgo + (30 * 24 * 60 * 60 * 1000),
      status: 'ARCHIVED' // Injected as archived to simulate past cycle
    });

    store.addUser({
        id: 'u1',
        name: 'Expert',
        voiceCredits: 100,
        reputation: { 'Engineering': 100 },
        delegates: {}
    });

    // initialize() should see cycle 1 is expired and transition
    // Since 60 days passed, and cycle is 30 days, it should transition TWICE to reach an ACTIVE cycle that includes NOW.
    const current = manager.initialize();

    expect(current.number).toBe(3);
    expect(current.status).toBe('ACTIVE');
    expect(current.startTime).toBeLessThanOrEqual(now);
    expect(current.endTime).toBeGreaterThan(now);

    const cycles = store.getCycles();
    expect(cycles.length).toBe(3);
    expect(cycles.find(c => c.number === 1)?.status).toBe('ARCHIVED');
    expect(cycles.find(c => c.number === 2)?.status).toBe('ARCHIVED');

    // Reputation decay should have applied twice: 100 -> 90 -> 81
    const user = store.getUser('u1');
    expect(user?.reputation['Engineering']).toBe(81);
  });
});
