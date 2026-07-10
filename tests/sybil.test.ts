import { Store } from '../src/models/Store';
import { SybilDetector } from '../src/core/sybil';

describe('SybilDetector', () => {
  let store: Store;
  let detector: SybilDetector;

  beforeEach(() => {
    store = new Store();
    detector = new SybilDetector(store);

    // Add normal users
    store.addUser({ id: 'u1', name: 'Alice', voiceCredits: 100, reputation: {}, delegates: {} });
    store.addUser({ id: 'u2', name: 'Bob', voiceCredits: 100, reputation: {}, delegates: {} });

    // Add Sybil cartel
    for (let i = 3; i <= 10; i++) {
        store.addUser({ id: `u${i}`, name: `Sybil${i}`, voiceCredits: 10, reputation: {}, delegates: {} });
    }
  });

  test('should cluster users with identical voting behavior', () => {
    // Normal votes
    store.addVote({ userId: 'u1', proposalId: 'p1', amount: 10, subject: 'A', timestamp: 0 });
    store.addVote({ userId: 'u2', proposalId: 'p2', amount: 10, subject: 'A', timestamp: 0 });

    // Cartel votes identically
    for (let i = 3; i <= 10; i++) {
        store.addVote({ userId: `u${i}`, proposalId: 'p3', amount: 10, subject: 'A', timestamp: 0 });
        store.addVote({ userId: `u${i}`, proposalId: 'p4', amount: 10, subject: 'A', timestamp: 0 });
    }

    const clusters = detector.detectClusters();

    // u3 through u10 should all have the same cluster ID
    const sybilClusterId = clusters['u3'];
    expect(sybilClusterId).toBeDefined();
    for (let i = 4; i <= 10; i++) {
        expect(clusters[`u${i}`]).toBe(sybilClusterId);
    }

    // u1 and u2 should be in different clusters from the cartel
    expect(clusters['u1']).not.toBe(sybilClusterId);
    expect(clusters['u2']).not.toBe(sybilClusterId);
  });

  test('should calculate penalty for large clusters', () => {
    const clusters: Record<string, string> = {
      'u1': 'cluster_1',
      'u2': 'cluster_2',
    };

    // Make cluster_3 large (8 members)
    for (let i = 3; i <= 10; i++) {
      clusters[`u${i}`] = 'cluster_3';
    }

    // Small clusters have 1.0 penalty (no penalty)
    expect(detector.calculateSybilPenalty('cluster_1', clusters)).toBe(1.0);

    // Large cluster should be penalized
    const penalty = detector.calculateSybilPenalty('cluster_3', clusters);
    expect(penalty).toBeLessThan(1.0);
    expect(penalty).toBe(1 / Math.sqrt(8));
  });
});
