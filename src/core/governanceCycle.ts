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
    if (existing) {
      // Check if the current cycle has already ended while the system was offline
      if (Date.now() > existing.endTime || existing.status === 'ARCHIVED') {
        return this.transitionCycle();
      }
      return existing;
    }

    const cycle: GovernanceCycle = {
      id: 'cycle-1',
      number: 1,
      startTime: Date.now(),
      endTime: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      status: 'ACTIVE',
      totalVotesCast: 0,
      totalFundingAllocated: 0
    };
    console.log("Initialized new cycle 1");
    this.store.addCycle(cycle);
    return cycle;
  }

  /**
   * Transitions from the current cycle to the next.
   * Performs reputation decay and voice credit refresh for all citizens.
   */
  transitionCycle(): GovernanceCycle {
    let current = this.store.getCurrentCycle();

    // 1. Create first cycle if none exists
    if (!current) {
      const cycle: GovernanceCycle = {
        id: 'cycle-1',
        number: 1,
        startTime: Date.now(),
        endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
        status: 'ACTIVE',
        totalVotesCast: 0,
        totalFundingAllocated: 0
      };
      this.store.addCycle(cycle);
      return cycle;
    }

    // 2. Multi-cycle catch-up
    let catchupOccurred = false;
    while (current && Date.now() > current.endTime) {
      current.status = 'ARCHIVED';
      this.store.addCycle(current);

      const next: GovernanceCycle = {
        id: `cycle-${current.number + 1}`,
        number: current.number + 1,
        startTime: current.endTime,
        endTime: current.endTime + 30 * 24 * 60 * 60 * 1000,
        status: 'ACTIVE',
        totalVotesCast: 0,
        totalFundingAllocated: 0
      };
      this.store.addCycle(next);
      this.processEndOfCycle();
      current = next;
      catchupOccurred = true;
    }

    // 3. Manual transition or edge case
    if (!catchupOccurred && current.status === 'ACTIVE') {
      current.status = 'ARCHIVED';
      current.endTime = Math.min(current.endTime, Date.now());
      this.store.addCycle(current);

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
      this.processEndOfCycle();
      return next;
    }

    return current;
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
