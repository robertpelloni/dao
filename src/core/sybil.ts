import { Store } from '../models/Store';

/**
 * Security Engine: Graph-based Sybil Detection
 *
 * Performs cluster analysis on voting and funding patterns to detect
 * coordinated actions typical of Sybil attacks or cartels.
 */
export class SybilDetector {
  constructor(private store: Store) {}

  /**
   * Identifies clusters of users who exhibit highly correlated behavior.
   * Returns a map of user IDs to their assigned "cluster ID".
   */
  detectClusters(proposalsIds?: string[]): Record<string, string> {
    const users = this.store.getUsers();
    const votes = this.store.getAllVotes();
    const contributions = this.store.getAllContributions();

    // Simplified cluster analysis using a basic similarity matrix
    const userBehaviors: Record<string, Set<string>> = {};
    users.forEach(u => userBehaviors[u.id] = new Set());

    // Record voting behavior
    votes.forEach(v => {
      if (userBehaviors[v.userId]) {
        userBehaviors[v.userId]!.add(`v_${v.proposalId}`);
      }
    });

    // Record funding behavior
    contributions.forEach(c => {
      if (userBehaviors[c.userId]) {
        userBehaviors[c.userId]!.add(`c_${c.proposalId}`);
      }
    });

    // Compute pairwise similarities (Jaccard index)
    const clusters: Record<string, string> = {};
    let clusterCounter = 1;

    users.forEach(u1 => {
      if (clusters[u1.id]) return; // Already clustered

      const clusterName = `cluster_${clusterCounter}`;
      clusters[u1.id] = clusterName;

      users.forEach(u2 => {
        if (u1.id === u2.id || clusters[u2.id]) return;

        const b1 = userBehaviors[u1.id];
        const b2 = userBehaviors[u2.id];

        if (!b1 || !b2) return;

        let intersection = 0;
        b1.forEach(action => {
          if (b2.has(action)) intersection++;
        });

        const union = b1.size + b2.size - intersection;
        if (union === 0) return;

        const similarity = intersection / union;

        // If similarity is extremely high (e.g., 90%), group them
        if (similarity > 0.90) {
          clusters[u2.id] = clusterName;
        }
      });
      clusterCounter++;
    });

    return clusters;
  }

  /**
   * Adjusts the effective power (or identifies as flagged) based on cluster density.
   * Large clusters of identical behavior face a "Sybil penalty" to their voting weight.
   */
  calculateSybilPenalty(clusterId: string, clusters: Record<string, string>): number {
    let count = 0;
    Object.values(clusters).forEach(id => {
      if (id === clusterId) count++;
    });

    // If cluster size is suspiciously large (e.g., > 5 users acting identically),
    // apply a penalty multiplier (e.g., 1 / sqrt(N))
    if (count > 5) {
      return 1 / Math.sqrt(count);
    }
    return 1.0; // No penalty
  }
}
