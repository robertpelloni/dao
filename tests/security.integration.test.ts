import { Store } from '../src/models/Store';
import { SecurityEngine } from '../src/core/security';
import { GovernanceManager } from '../src/core/governanceCycle';
import { IdentityManager } from '../src/core/identity';

describe('Security Engine Integration', () => {
  let store: Store;
  let security: SecurityEngine;
  let governance: GovernanceManager;
  let identity: IdentityManager;

  beforeEach(() => {
    store = new Store(':memory:');
    security = new SecurityEngine(store);
    governance = new GovernanceManager(store);
    identity = new IdentityManager(store);
  });

  it('should detect a Sybil cluster funneling power to a sink', () => {
    // 1. Create a "Sink" user
    const sinkId = 'sink-user';
    store.addUser({ id: sinkId, name: 'Sink User', voiceCredits: 100, reputation: {}, delegates: {} });

    // 2. Create 5 suspicious "Source" users delegating to sink
    for (let i = 1; i <= 6; i++) {
      const sourceId = `source-${i}`;
      store.addUser({
        id: sourceId,
        name: `Source ${i}`,
        voiceCredits: 100,
        reputation: {},
        delegates: { 'General': sinkId }
      });
    }

    const flagged = security.detectSybilClusters();
    expect(flagged).toContain(sinkId);
  });

  it('should correctly calculate reputation decay', () => {
    const initialRep = 100;
    const decayedOnce = security.calculateReputationDecay(initialRep, 1);
    const decayedTwice = security.calculateReputationDecay(initialRep, 2);

    expect(decayedOnce).toBe(90);
    expect(decayedTwice).toBe(81);
  });

  it('should apply security checks during governance cycle transition', () => {
    // Setup Sybil cluster
    const sinkId = 'sink-user';
    store.addUser({ id: sinkId, name: 'Sink User', voiceCredits: 100, reputation: {}, delegates: {} });
    for (let i = 1; i <= 6; i++) {
      store.addUser({ id: `source-${i}`, name: `Source ${i}`, voiceCredits: 100, reputation: {}, delegates: { 'General': sinkId } });
    }

    // Setup reputation for decay
    const activeUserId = 'active-user';
    store.addUser({ id: activeUserId, name: 'Active', voiceCredits: 100, reputation: { 'General': 100 }, delegates: {} });

    // Advance time and transition
    // Reset any existing cycle state
    store.clear();
    store.addUser({ id: sinkId, name: 'Sink User', voiceCredits: 100, reputation: {}, delegates: {} });
    for (let i = 1; i <= 6; i++) {
      store.addUser({ id: `source-${i}`, name: `Source ${i}`, voiceCredits: 100, reputation: {}, delegates: { 'General': sinkId } });
    }
    store.addUser({ id: activeUserId, name: 'Active', voiceCredits: 100, reputation: { 'General': 100 }, delegates: {} });

    governance.initialize();
    const future = Date.now() + 31 * 24 * 60 * 60 * 1000;
    jest.spyOn(Date, 'now').mockReturnValue(future);

    governance.transitionCycle();

    const activeUser = store.getUser(activeUserId);
    expect(activeUser?.reputation['General']).toBe(90);
  });
});
