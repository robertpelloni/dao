import { Store } from '../src/models/Store';
import { GovernanceManager } from '../src/core/governanceCycle';
import { User } from '../src/models/types';

describe('Automated Reputation Decay Simulation', () => {
  let store: Store;
  let gm: GovernanceManager;

  beforeEach(() => {
    store = new Store(':memory:');
    gm = new GovernanceManager(store);
  });

  test('reputation should decay by 10% per cycle', () => {
    const user: User = {
      id: 'expert',
      name: 'Expert',
      voiceCredits: 100,
      reputation: { 'Infrastructure': 100 },
      delegates: {}
    };
    store.addUser(user);

    // Initial cycle
    const cycle1 = gm.initialize();

    // Fast forward time to end of cycle 1
    const endTime = cycle1.endTime + 1000;
    jest.useFakeTimers();
    jest.setSystemTime(endTime);

    // Transition to cycle 2
    gm.transitionCycle();

    const updatedUser = store.getUser('expert')!;
    expect(updatedUser.reputation['Infrastructure']).toBe(90);

    // Transition to cycle 3
    const cycle2 = store.getCurrentCycle()!;
    jest.setSystemTime(cycle2.endTime + 1000);
    gm.transitionCycle();

    const finalUser = store.getUser('expert')!;
    expect(finalUser.reputation['Infrastructure']).toBe(81);

    jest.useRealTimers();
  });

  test('voice credits should refresh to base level', () => {
    const user: User = {
      id: 'citizen',
      name: 'Citizen',
      voiceCredits: 10, // Low credits
      reputation: {},
      delegates: {}
    };
    store.addUser(user);

    const cycle1 = gm.initialize();
    jest.useFakeTimers();
    jest.setSystemTime(cycle1.endTime + 1000);

    gm.transitionCycle();

    const refreshedUser = store.getUser('citizen')!;
    expect(refreshedUser.voiceCredits).toBe(100);

    jest.useRealTimers();
  });
});
