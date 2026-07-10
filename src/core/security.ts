import { Store } from '../models/Store';
import { User } from '../models/types';

/**
 * Security Engine
 *
 * Implements advanced data-processing algorithms for:
 * 1. Sybil Attack Detection: Identifying suspicious delegation clusters.
 * 2. Reputation Decay: Automating the erosion of dormant reputation.
 */
export class SecurityEngine {
  constructor(private store: Store) {}

  /**
   * Identifies suspicious clusters and anomalies in the delegation graph.
   *
   * 1. Sink Detection: nodes receiving delegations from many inactive/low-rep accounts.
   * 2. Chain Depth Analysis: detecting deep nested delegations (depth > 3) often used in Sybil puppet networks.
   */
  detectSybilClusters(): string[] {
    const users = this.store.getUsers();
    const flaggedSinks = new Set<string>();

    // Heuristic 1: Sink Detection
    for (const user of users) {
      const incomingDelegations = users.filter(u =>
        Object.values(u.delegates).includes(user.id)
      );

      if (incomingDelegations.length >= 5) {
        let suspiciousCount = 0;
        for (const source of incomingDelegations) {
          const totalRep = Object.values(source.reputation).reduce((a, b) => a + b, 0);
          if (totalRep < 5 && !this.hasActivity(source)) {
            suspiciousCount++;
          }
        }

        if (suspiciousCount / incomingDelegations.length > 0.8) {
          flaggedSinks.add(user.id);
        }
      }

      // Heuristic 2: Chain Depth Analysis
      // Check every subject the user has delegations for
      const subjects = new Set<string>();
      users.forEach(u => Object.keys(u.delegates).forEach(s => subjects.add(s)));

      for (const subject of subjects) {
         const depth = this.calculateDelegationDepth(user.id, subject);
         if (depth > 3) {
            flaggedSinks.add(user.id);
            console.warn(`[SECURITY] User ${user.id} flagged for excessive delegation depth (${depth}) in ${subject}`);
         }
      }
    }

    return Array.from(flaggedSinks);
  }

  /**
   * Calculates the maximum depth of the delegation chain leading to this user.
   */
  private calculateDelegationDepth(userId: string, subject: string, visited = new Set<string>()): number {
     if (visited.has(userId)) return 0; // Prevent infinite loops
     visited.add(userId);

     const users = this.store.getUsers();
     const directDelegators = users.filter(u => u.delegates[subject] === userId);

     if (directDelegators.length === 0) return 0;

     let maxChildDepth = 0;
     for (const delegator of directDelegators) {
        const depth = this.calculateDelegationDepth(delegator.id, subject, new Set(visited));
        maxChildDepth = Math.max(maxChildDepth, depth);
     }

     return 1 + maxChildDepth;
  }

  /**
   * Calculates the reputation decay for a user based on inactivity.
   *
   * Formula: NewRep = OldRep * (0.9 ^ missedCycles)
   */
  calculateReputationDecay(currentReputation: number, missedCycles: number): number {
    if (missedCycles <= 0) return currentReputation;
    const decayFactor = Math.pow(0.9, missedCycles);
    return Math.floor(currentReputation * decayFactor);
  }

  private hasActivity(user: User): boolean {
    // Query actual votes and contributions from the Store
    const votes = this.store.getVotesByUser(user.id);
    const contributions = this.store.getContributionsByUser(user.id);

    // Activity is defined as having cast at least one vote or made one contribution
    return votes.length > 0 || contributions.length > 0;
  }
}
