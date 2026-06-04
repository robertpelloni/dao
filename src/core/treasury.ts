import { Store } from '../models/Store';
import { Proposal } from '../models/types';
import { Contribution } from './crowdfunding';

/**
 * Treasury and Quadratic Funding (QF) Engine
 *
 * Implements the Quadratic Funding formula to match individual contributions
 * using a central matching pool.
 * QF Match = (Sum(Sqrt(contributions)))^2 - Sum(contributions)
 */
export class TreasuryManager {
  private matchingPool: number = 0;

  constructor(private store: Store) {}

  /**
   * Sets the matching pool for the current governance cycle.
   */
  setMatchingPool(amount: number): void {
    this.matchingPool = amount;
  }

  /**
   * Calculates the Quadratic Funding match for a proposal.
   *
   * @param contributions List of individual contributions
   * @returns The calculated matching amount
   */
  calculateMatch(contributions: Contribution[]): number {
    if (contributions.length === 0) return 0;

    // Sum of square roots of contributions
    const sumSqrt = contributions.reduce((acc, c) => acc + Math.sqrt(c.amount), 0);

    // Total QF value
    const qfValue = Math.pow(sumSqrt, 2);

    // The match is the QF value minus actual contributions
    const totalContributed = contributions.reduce((acc, c) => acc + c.amount, 0);

    return Math.max(0, qfValue - totalContributed);
  }

  /**
   * Allocates matching funds to all funded proposals based on their QF scores.
   * If the total matching requirement exceeds the pool, it scales proportionally.
   */
  allocateMatchingFunds(proposals: Proposal[], allContributions: Map<string, Contribution[]>): Record<string, number> {
    const matches: Record<string, number> = {};
    let totalMatchRequired = 0;

    proposals.forEach(p => {
      const pContributions = allContributions.get(p.id) || [];
      const match = this.calculateMatch(pContributions);
      matches[p.id] = match;
      totalMatchRequired += match;
    });

    // Scale if we exceed the pool
    if (totalMatchRequired > this.matchingPool && totalMatchRequired > 0) {
      const scale = this.matchingPool / totalMatchRequired;
      Object.keys(matches).forEach(id => {
        const currentMatch = matches[id];
        if (currentMatch !== undefined) {
           matches[id] = currentMatch * scale;
        }
      });
    }

    return matches;
  }

  getPoolBalance(): number {
    return this.matchingPool;
  }
}
