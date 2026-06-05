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
   * Identifies suspicious clusters in the delegation graph.
   *
   * A "Sybil Cluster" is defined here as a group of accounts that have
   * high internal delegation density but low external interaction,
   * often funneling power to a single "sink" node.
   *
   * Heuristic: If a node receives delegations from > 5 accounts that have
   * low reputation and low activity, it is flagged.
   */
  detectSybilClusters(): string[] {
    const users = this.store.getUsers();
    const flaggedSinks: string[] = [];

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
          flaggedSinks.push(user.id);
        }
      }
    }

    return flaggedSinks;
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
    // In a real system, we'd query votes/contributions tables.
    // For this PoC, we check if they have spent any credits or have significant reputation.
    const totalRep = Object.values(user.reputation).reduce((a, b) => a + b, 0);
    return user.voiceCredits < 100 || totalRep > 10;
  }
}
