import { Store } from '../models/Store';
import { Proposal, Contribution } from '../models/types';

export class ExchangeRateOracle {
  static getRate(fromToken: string, toToken: string): number {
    if (fromToken === toToken) return 1;
    const rates: Record<string, number> = {
      'USD': 1,
      'ETH': 3000,
      'BTC': 60000,
      'DAI': 1,
      'USDC': 1,
      'UNI': 10
    };
    const fromRate = rates[fromToken] || 1;
    const toRate = rates[toToken] || 1;
    return fromRate / toRate;
  }
}

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

  constructor(private store: Store) {
    // Initialize default USD pool
    this.matchingPools.set('USD', 0);
  }

  /**
   * Sets the matching pool for a specific token.
   */
  setMatchingPool(amount: number, tokenSymbol: string = 'USD'): void {
    this.matchingPools.set(tokenSymbol, amount);
  }

  /**
   * Legacy calculateMatch for backwards compatibility.
   * Calculates the match for a specific token pool.
   */
  calculateMatch(contributions: Contribution[]): number {
    if (contributions.length === 0) return 0;
    const sumSqrt = contributions.reduce((acc, c) => acc + Math.sqrt(c.amount), 0);
    const qfValue = Math.pow(sumSqrt, 2);
    const totalContributed = contributions.reduce((acc, c) => acc + c.amount, 0);
    return Math.max(0, qfValue - totalContributed);
  }

  getPoolBalance(tokenSymbol: string = 'USD'): number {
    return this.matchingPools.get(tokenSymbol) || 0;
  }

  getAllPools(): Record<string, number> {
    const result: Record<string, number> = {};
    this.matchingPools.forEach((amount, symbol) => {
      result[symbol] = amount;
    });
    return result;
  }
}
