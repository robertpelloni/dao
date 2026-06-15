import { Store, globalStore } from '../models/Store';
import { GovernanceCycle, User, Committee } from '../models/types';
import { SecurityEngine } from './security';
import { globalIdentity } from './identity';
import { TreasuryManager } from './treasury';

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
    const committees = this.store.getCommittees();
    const treasury = new TreasuryManager(this.store);

    // 0. Committee Sunset Logic: reallocate funds from inactive committees
    const INACTIVITY_THRESHOLD = 60 * 24 * 60 * 60 * 1000; // 60 days
    committees.forEach(c => {
      const lastActivity = c.lastActivityAt || 0;
      if (Date.now() - lastActivity > INACTIVITY_THRESHOLD && c.subject !== 'General') {
        const balance = treasury.getPoolBalance('USD', c.subject);
        if (balance > 0) {
          console.log(`[SUNSET] Committee ${c.id} is inactive. Reallocating $${balance} to General pool.`);
          treasury.reallocate(balance, 'USD', c.subject, 'General', 'Committee Inactivity Sunset');
        }
      }
    });

    // 1. Run Sybil Detection
    const flaggedSinks = this.security.detectSybilClusters();
    flaggedSinks.forEach(sinkId => {
      globalIdentity.flagSybil(sinkId);
      console.warn(`[SECURITY] Flagged user ${sinkId} as Sybil Sink.`);
    });

    // 1.5. Auto-provision high-activity committees
    const newSubjects = this.store.getHighActivitySubjects(5); // Threshold of 5 delegations
    newSubjects.forEach(subject => {
       const id = `${subject.replace(/\s+/g, '-')}-Committee`;
       if (!this.store.getCommittee(id)) {
          this.store.addCommittee({
             id,
             subject,
             members: [],
             thresholdQuorum: 0.05,
             lastActivityAt: Date.now()
          });
          console.log(`[GOVERNANCE] Auto-provisioned committee for active subject: ${subject}`);
       }
    });

    for (const user of users) {
      // 2. Reputation Decay (Use SecurityEngine for automated erosion)
      const newReputation: Record<string, number> = {};
      let totalRep = 0;
      Object.entries(user.reputation).forEach(([subject, value]) => {
        const decayed = this.security.calculateReputationDecay(value, missedCycles);
        newReputation[subject] = decayed;
        totalRep += decayed;
      });

      // 3. Voice Credit Refresh (Refill to base 100)
      // 4. Meritocratic Stipend: 1 extra credit per 5 rep points, capped at 50 bonus.
      const bonus = Math.min(50, Math.floor(totalRep / 5));
      const refillAmount = 100 + bonus;

      const updatedUser: User = {
        ...user,
        reputation: newReputation,
        voiceCredits: Math.max(user.voiceCredits, refillAmount)
      };

      this.store.addUser(updatedUser);
      if (bonus > 0) {
        console.log(`[GOVERNANCE] User ${user.id} received ${bonus} bonus merit credits.`);
      }
    }
  }
}

export const globalGovernance = new GovernanceManager(globalStore);
