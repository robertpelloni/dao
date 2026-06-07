import { Store } from '../models/Store';
import { Proposal, Contribution } from '../models/types';

/**
 * Treasury and Quadratic Funding (QF) Engine
 *
 * Implements the Quadratic Funding formula to match individual contributions
 * using a central matching pool.
 * QF Match = (Sum(Sqrt(contributions)))^2 - Sum(contributions)
 */
export class TreasuryManager {
  constructor(private store: Store) {
    // Ensure default USD pool exists in persistent store if not set
    if (this.store.getMatchingPool('USD') === 0) {
      this.store.setMatchingPool('USD', 0);
    }
  }

  /**
   * Sets the matching pool for a specific token.
   */
  setMatchingPool(amount: number, tokenSymbol: string = 'USD'): void {
    this.store.setMatchingPool(tokenSymbol, amount);
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
   * If the total matching requirement exceeds the pool for that token, it scales proportionally.
   */
  allocateMatchingFunds(
    proposals: Proposal[],
    allContributions: Map<string, Contribution[]>,
    tokenSymbol: string = 'USD'
  ): Record<string, number> {
    const pool = this.store.getMatchingPool(tokenSymbol);
    const matches: Record<string, number> = {};
    let totalMatchRequired = 0;

    proposals.forEach(p => {
      const pContributions = allContributions.get(p.id) || [];
      const match = this.calculateMatch(pContributions);
      matches[p.id] = match;
      totalMatchRequired += match;
    });

    // Scale if we exceed the pool
    if (totalMatchRequired > pool && totalMatchRequired > 0) {
      const scale = pool / totalMatchRequired;
      Object.keys(matches).forEach(id => {
        const currentMatch = matches[id];
        if (currentMatch !== undefined) {
           matches[id] = currentMatch * scale;
        }
      });
    }

    return matches;
  }

  getPoolBalance(tokenSymbol: string = 'USD'): number {
    return this.store.getMatchingPool(tokenSymbol);
  }

  getAllPools(): Record<string, number> {
    return this.store.getAllMatchingPools();
  }

  deposit(amount: number, tokenSymbol: string = 'USD', description: string = 'Deposit'): void {
    const current = this.getPoolBalance(tokenSymbol);
    this.setMatchingPool(current + amount, tokenSymbol);

    this.store.addTreasuryTransaction({
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tokenSymbol,
      amount,
      type: 'DEPOSIT',
      description,
      timestamp: Date.now()
    });
  }

  getTransactions(): any[] {
    return this.store.getTreasuryTransactions();
  }
}
