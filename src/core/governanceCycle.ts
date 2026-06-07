import { Store, globalStore } from '../models/Store';
import { GovernanceCycle, User } from '../models/types';
import { SecurityEngine } from './security';
import { globalIdentity } from './identity';

/**
 * Governance Cycle Manager
 * Handles transitions between governance epochs, reputation decay, and credit refreshing.
 */
export class GovernanceManager {
  private security: SecurityEngine;

  constructor(private store: Store) {
    this.security = new SecurityEngine(store);
  }

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
      console.log(`Transitioning to cycle ${next.number}`);
      this.processEndOfCycle(1); // 1 cycle missed at a time in loop
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
      this.processEndOfCycle(1);
      return next;
    }

    return current;
  }

  private processEndOfCycle(missedCycles: number = 1) {
    const users = this.store.getUsers();

    // 1. Run Sybil Detection
    const flaggedSinks = this.security.detectSybilClusters();
    flaggedSinks.forEach(sinkId => {
      globalIdentity.flagSybil(sinkId);
      console.warn(`[SECURITY] Flagged user ${sinkId} as Sybil Sink.`);
    });

    for (const user of users) {
      // 2. Reputation Decay (Use SecurityEngine for automated erosion)
      const newReputation: Record<string, number> = {};
      Object.entries(user.reputation).forEach(([subject, value]) => {
        newReputation[subject] = this.security.calculateReputationDecay(value, missedCycles);
      });

      // 3. Voice Credit Refresh (Refill to base 100 or matching new rules)
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
