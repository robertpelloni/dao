import { Store } from '../models/Store';
import { Proposal, Contribution } from '../models/types';
import { globalIdentity } from './identity';

/**
 * Treasury and Quadratic Funding (QF) Engine
 *
 * Implements the Quadratic Funding formula to match individual contributions
 * using a central matching pool.
 * QF Match = (Sum(Sqrt(contributions)))^2 - Sum(contributions)
 */
import { IdentityManager } from './identity';

export class TreasuryManager {
  private identity: IdentityManager;

  constructor(private store: Store) {
    this.identity = new IdentityManager(store);
    // Ensure default USD pool exists in persistent store if not set
    if (this.store.getMatchingPool('USD', 'General') === 0) {
      this.store.setMatchingPool('USD', 'General', 0);
  constructor(private store: Store) {
    // Ensure default USD pool exists in persistent store if not set
    if (this.store.getMatchingPool('USD') === 0) {
      this.store.setMatchingPool('USD', 0);
    }
  }

  /**
   * Sets the matching pool for a specific token and subject.
   */
  setMatchingPool(amount: number, tokenSymbol: string = 'USD', subject: string = 'General'): void {
    this.store.setMatchingPool(tokenSymbol, subject, amount);
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
   * If the total matching requirement exceeds the pool for that token and subject, it scales proportionally.
   */
  allocateMatchingFunds(
    proposals: Proposal[],
    allContributions: Map<string, Contribution[]>,
    tokenSymbol: string = 'USD',
    subject: string = 'General'
  ): Record<string, number> {
    const pool = this.store.getMatchingPool(tokenSymbol, subject);
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

  getPoolBalance(tokenSymbol: string = 'USD', subject: string = 'General'): number {
    return this.store.getMatchingPool(tokenSymbol, subject);
  }

  getAllPools(): any[] {
    return this.store.getAllMatchingPools();
  }

  deposit(amount: number, tokenSymbol: string = 'USD', subject: string = 'General', description: string = 'Deposit', userId?: string): void {
    const current = this.getPoolBalance(tokenSymbol, subject);
    this.setMatchingPool(current + amount, tokenSymbol, subject);
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
      subject,
      userId: userId || null,
      amount,
      type: 'DEPOSIT',
      description,
      timestamp: Date.now()
    });

    // Reward reputation for voluntary contribution (1 rep per 10 USD)
    if (userId && amount > 0 && tokenSymbol === 'USD') {
      const repReward = Math.floor(amount / 10);
      if (repReward > 0) {
        this.identity.rewardReputation(userId, subject, repReward);
        console.log(`Rewarding user ${userId} with ${repReward} reputation in ${subject} for contribution.`);
      }
    }
  }

  getTransactions(): any[] {
    return this.store.getTreasuryTransactions();
  }

  /**
   * Reallocates funds between matching pools.
   */
  reallocate(amount: number, tokenSymbol: string, fromSubject: string, toSubject: string, description: string = 'Reallocation'): void {
    const fromBalance = this.getPoolBalance(tokenSymbol, fromSubject);
    if (fromBalance < amount) throw new Error(`Insufficient funds in ${fromSubject} pool.`);

    this.setMatchingPool(fromBalance - amount, tokenSymbol, fromSubject);
    this.setMatchingPool(this.getPoolBalance(tokenSymbol, toSubject) + amount, tokenSymbol, toSubject);

    this.store.addTreasuryTransaction({
      id: `realloc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tokenSymbol,
      subject: fromSubject,
      amount: -amount,
      type: 'REALLOCATION_OUT',
      description: `${description} (To ${toSubject})`,
      timestamp: Date.now()
    });

    this.store.addTreasuryTransaction({
      id: `realloc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tokenSymbol,
      subject: toSubject,
      amount: amount,
      type: 'REALLOCATION_IN',
      description: `${description} (From ${fromSubject})`,
      timestamp: Date.now()
    });
    });
  }

  getTransactions(): any[] {
    return this.store.getTreasuryTransactions();
  }
}
