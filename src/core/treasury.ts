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

  // Subject-specific matching pools (Voluntary Tax Routing), keyed `${token}::${subject}`.
  // Kept separate from token pools so existing token-only callers/tests are unaffected;
  // governanceCycle sunset and REALLOCATE_FUNDS proposals move funds between these.
  private subjectPools: Map<string, number> = new Map();

  private subjectKey(tokenSymbol: string, subject: string): string {
    return `${tokenSymbol}::${subject}`;
  }

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
   * When `subject` is given, sets that subject-specific pool instead.
   */
  setMatchingPool(amount: number, tokenSymbol: string = 'USD', subject?: string): void {
    if (subject) {
      this.subjectPools.set(this.subjectKey(tokenSymbol, subject), amount);
    } else {
      this.matchingPools.set(tokenSymbol, amount);
    }
  }

  /**
   * Moves funds between subject-specific pools (e.g. inactive-committee sunset
   * back to General, or a passed REALLOCATE_FUNDS proposal). Moves at most the
   * available source balance; returns the amount actually moved (0 = no-op).
   * Side effect: records a REALLOCATION treasury transaction when funds move.
   */
  reallocate(amount: number, tokenSymbol: string = 'USD', fromSubject: string = 'General', toSubject?: string, reason: string = 'Reallocation'): number {
    if (!toSubject || toSubject === fromSubject || amount <= 0) return 0;
    const available = this.getPoolBalance(tokenSymbol, fromSubject);
    const moved = Math.min(amount, available);
    if (moved <= 0) return 0;
    this.setMatchingPool(available - moved, tokenSymbol, fromSubject);
    this.setMatchingPool(this.getPoolBalance(tokenSymbol, toSubject) + moved, tokenSymbol, toSubject);
    this.store.addTreasuryTransaction({
      id: `realloc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tokenSymbol,
      amount: moved,
      type: 'REALLOCATION',
      description: `${reason}: ${fromSubject} -> ${toSubject}`,
      timestamp: Date.now()
    });
    return moved;
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
      // Only match if tokens match or default to tokenSymbol
      if (p.tokenSymbol && p.tokenSymbol !== tokenSymbol) return;

      const pContributions = allContributions.get(p.id) || [];
      // Only count contributions matching this token (or if tokenSymbol is omitted on contribution)
      const validContributions = pContributions.filter(c => !c.tokenSymbol || c.tokenSymbol === tokenSymbol);

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

  // With `subject`, returns that subject-specific pool; without, the token pool.
  getPoolBalance(tokenSymbol: string = 'USD', subject?: string): number {
    if (subject) return this.subjectPools.get(this.subjectKey(tokenSymbol, subject)) || 0;
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
  // With `subject`, funds that subject-specific pool (Voluntary Tax Routing entry point);
  // without, funds the token pool exactly as before.
  deposit(amount: number, tokenSymbol: string = 'USD', description: string = 'Deposit', subject?: string): void {
    const current = this.getPoolBalance(tokenSymbol, subject);
    this.setMatchingPool(current + amount, tokenSymbol, subject);

    this.store.addTreasuryTransaction({
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tokenSymbol,
      amount,
      type: 'DEPOSIT',
      description,
      ...(subject ? { subject } : {}),
      timestamp: Date.now()
    });
  }

  getTransactions(): any[] {
    return this.store.getTreasuryTransactions ? this.store.getTreasuryTransactions() : [];
  }
}
