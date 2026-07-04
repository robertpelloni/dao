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
  // Map of token symbol to matching pool amount
  private matchingPools: Map<string, number> = new Map();

  // Total funds available in the treasury mapped by token symbol
  private treasuryBalances: Map<string, number> = new Map();

  constructor(private store: Store) {
    // Initialize default USD pool
    this.matchingPools.set('USD', 0);
    this.treasuryBalances.set('USD', 0);
  }

  /**
   * Intakes funds into the treasury for a given token.
   */
  intakeFunds(amount: number, tokenSymbol: string = 'USD'): void {
    if (amount <= 0) return;
    const currentBalance = this.treasuryBalances.get(tokenSymbol) || 0;
    this.treasuryBalances.set(tokenSymbol, currentBalance + amount);
  }

  /**
   * Allocates an amount from the treasury balance to the specific QF matching pool for that token.
   */
  allocateToMatchingPool(amount: number, tokenSymbol: string = 'USD'): boolean {
    const currentBalance = this.treasuryBalances.get(tokenSymbol) || 0;
    if (amount > currentBalance || amount <= 0) {
      return false; // Insufficient funds in the treasury
    }

    // Deduct from treasury balance
    this.treasuryBalances.set(tokenSymbol, currentBalance - amount);

    // Add to matching pool
    const currentPool = this.matchingPools.get(tokenSymbol) || 0;
    this.matchingPools.set(tokenSymbol, currentPool + amount);
    return true;
  }

  /**
   * Sets the matching pool for a specific token (legacy/override usage).
   */
  setMatchingPool(amount: number, tokenSymbol: string = 'USD'): void {
    this.matchingPools.set(tokenSymbol, amount);
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
    const pool = this.matchingPools.get(tokenSymbol) || 0;
    const matches: Record<string, number> = {};
    let totalMatchRequired = 0;

    proposals.forEach(p => {
      // Only match if tokens match
      if (p.tokenSymbol !== tokenSymbol) return;

      const pContributions = allContributions.get(p.id) || [];
      // Only count contributions matching this token
      const validContributions = pContributions.filter(c => c.tokenSymbol === tokenSymbol);

      const match = this.calculateMatch(validContributions);
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
    return this.matchingPools.get(tokenSymbol) || 0;
  }

  getTreasuryBalance(tokenSymbol: string = 'USD'): number {
    return this.treasuryBalances.get(tokenSymbol) || 0;
  }

  getAllPools(): Record<string, number> {
    const result: Record<string, number> = {};
    this.matchingPools.forEach((amount, symbol) => {
      result[symbol] = amount;
    });
    return result;
  }

  getAllTreasuryBalances(): Record<string, number> {
    const result: Record<string, number> = {};
    this.treasuryBalances.forEach((amount, symbol) => {
      result[symbol] = amount;
    });
    return result;
  }
}
