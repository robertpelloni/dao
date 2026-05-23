import { Store, globalStore } from '../models/Store';
import { GovernanceCycle, User } from '../models/types';

/**
 * Governance Cycle Manager
 * Handles transitions between governance epochs, reputation decay, and credit refreshing.
 */
export class GovernanceManager {
  constructor(private store: Store) {}

  /**
   * Initializes the first governance cycle if none exists.
   */
  initialize(): GovernanceCycle {
    const existing = this.store.getCurrentCycle();
    if (existing) return existing;

    const cycle: GovernanceCycle = {
      id: 'cycle-1',
      number: 1,
      startTime: Date.now(),
      endTime: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      status: 'ACTIVE',
      totalVotesCast: 0,
      totalFundingAllocated: 0
    };
    this.store.addCycle(cycle);
    return cycle;
  }

  /**
   * Transitions from the current cycle to the next.
   * Performs reputation decay and voice credit refresh for all citizens.
   */
  transitionCycle(): GovernanceCycle {
    const current = this.store.getCurrentCycle();
    if (!current) throw new Error('No active cycle found');

    // Archive current cycle
    current.status = 'ARCHIVED';
    this.store.addCycle(current);

    // Create next cycle
    const next: GovernanceCycle = {
      id: `cycle-${current.number + 1}`,
      number: current.number + 1,
      startTime: Date.now(),
      endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
      status: 'ACTIVE',
      totalVotesCast: 0,
      totalFundingAllocated: 0
    };
    this.store.addCycle(next);

    // Perform maintenance on users
    this.processEndOfCycle();

    return next;
  }

  private processEndOfCycle() {
    const users = this.store.getUsers();
    for (const user of users) {
      // 1. Reputation Decay (10% decay per cycle to ensure experts stay current)
      const newReputation: Record<string, number> = {};
      Object.entries(user.reputation).forEach(([subject, value]) => {
        newReputation[subject] = Math.round(value * 0.9 * 100) / 100;
      });

      // 2. Voice Credit Refresh (Refill to base 100 or matching new rules)
      const updatedUser: User = {
        ...user,
        reputation: newReputation,
        voiceCredits: Math.max(user.voiceCredits, 100) // Citizens get a baseline refill
      };

      this.store.addUser(updatedUser);
    }
  }
}

export const globalGovernance = new GovernanceManager(globalStore);
