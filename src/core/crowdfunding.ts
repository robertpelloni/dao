import { Store } from '../models/Store';
import { TreasuryManager, ExchangeRateOracle } from './treasury';
import { globalIdentity } from './identity';
import { Contribution } from '../models/types';

/**
 * Crowdfunding and Escrow Engine
 *
 * Manages financial contributions to proposals and their release based on milestones.
 * Implements Dominant Assurance logic where funds are held in escrow and returned if the goal isn't met.
 */
export class CrowdfundingEngine {
  private contributions: Map<string, Contribution[]> = new Map();
  private treasury: TreasuryManager;

  constructor(private store: Store) {
    this.treasury = new TreasuryManager(store);
  }

  getTreasury(): TreasuryManager {
    return this.treasury;
  }

  /**
   * Contribute funds to a proposal.
   */
  contribute(userId: string, proposalId: string, amount: number, tokenSymbol?: string): void {
    const proposal = this.store.getProposal(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    const contributionToken = tokenSymbol || proposal.tokenSymbol || 'USD';
    const contribution: Contribution = {
      userId,
      proposalId,
      amount,
      tokenSymbol: contributionToken,
      timestamp: Date.now()
    };

    const list = this.contributions.get(proposalId) || [];
    list.push(contribution);
    this.contributions.set(proposalId, list);

    // Convert contribution to proposal's native token for accurate funding tracking
    const targetToken = proposal.tokenSymbol || 'USD';
    const rate = ExchangeRateOracle.getRate(contributionToken, targetToken);
    const convertedAmount = amount * rate;

    // Update proposal state
    this.store.updateProposal(proposalId, {
      currentFunding: (proposal.currentFunding || 0) + convertedAmount
    });

    // Persist contribution for security analysis
    this.store.addContribution({
      userId,
      proposalId,
      amount,
      tokenSymbol: contributionToken,
      timestamp: contribution.timestamp
    });
  }

  /**
   * Finalize funding for a proposal.
   */
  finalizeFunding(proposalId: string): boolean {
    const proposal = this.store.getProposal(proposalId);
    if (!proposal) return false;

    if (proposal.currentFunding >= proposal.totalTargetBudget) {

      const targetToken = proposal.tokenSymbol || 'USD';
      const pContributions = this.contributions.get(proposalId) || [];

      // Calculate matches for all token types natively
      // Instead of naive mixed summing, we track contributions normalized to the base pool's token
      // For simplicity, we assume matching is paid out in the proposal's native token

      // Normalize contributions to proposal's native token before matching
      const normalizedContributions: Contribution[] = pContributions.map(c => ({
        ...c,
        amount: c.amount * ExchangeRateOracle.getRate(c.tokenSymbol, targetToken),
        tokenSymbol: targetToken
      }));

      const match = this.treasury.calculateMatch(normalizedContributions);
      const poolBalance = this.treasury.getPoolBalance(targetToken);

      // Cap match at the available pool balance for that specific token
      const actualMatch = Math.min(match, poolBalance);

      // Deduct from pool if actualMatch > 0
      if (actualMatch > 0) {
         this.treasury.setMatchingPool(poolBalance - actualMatch, targetToken);
         // Persist the withdrawal so the treasury doesn't double-spend on restart
         this.store.addTreasuryTransaction({
           id: `match-${proposalId}-${Date.now()}`,
           tokenSymbol: targetToken,
           amount: actualMatch,
           type: 'WITHDRAWAL',
           timestamp: Date.now()
         });
      }

      // Assign random juries for all milestones
      const verifiedHumans = this.store.getUsers().filter(u => globalIdentity.isVerified(u.id)).map(u => u.id);
      const updatedMilestones = proposal.milestones.map(m => {
        const jury = [...verifiedHumans].sort(() => 0.5 - Math.random()).slice(0, 3);
        return { ...m, assignedJury: jury, requiredJuryQuorum: Math.min(jury.length, 2) };
      });

      this.store.updateProposal(proposalId, {
        status: 'FUNDED',
        currentFunding: proposal.currentFunding + actualMatch,
        milestones: updatedMilestones
      });
      return true;
    } else {
      this.refund(proposalId);
      this.store.updateProposal(proposalId, { status: 'REJECTED' });
      return false;
    }
  }

  private refund(proposalId: string): void {
    const list = this.contributions.get(proposalId) || [];
    console.log(`Refunding ${list.length} contributors for proposal ${proposalId}`);
    this.contributions.delete(proposalId);
    this.store.updateProposal(proposalId, { currentFunding: 0 });
  }

  voteOnMilestone(proposalId: string, milestoneId: string, userId: string): void {
    const proposal = this.store.getProposal(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    const milestones = [...proposal.milestones];
    const index = milestones.findIndex(m => m.id === milestoneId);
    if (index === -1) throw new Error('Milestone not found');

    const milestone = milestones[index]!;
    const votes = [...(milestone.juryVotes || [])];
    const assigned = milestone.assignedJury || [];

    if (assigned.length > 0 && !assigned.includes(userId)) {
      throw new Error('User is not an assigned jury member for this milestone');
    }

    if (votes.includes(userId)) {
      throw new Error('User already voted on this milestone');
    }

    votes.push(userId);
    milestones[index] = { ...milestone, juryVotes: votes };

    this.store.updateProposal(proposalId, { milestones });

    // Weighted Jury voting evaluation
    const required = milestone.requiredJuryQuorum || 1;

    // Evaluate if we should release based on total reputation weight of voters
    let totalJuryWeight = 0;
    for(const voterId of votes) {
        const u = this.store.getUser(voterId);
        if (u) {
            if (proposal.committeeId && u.reputation && u.reputation[proposal.committeeId]) {
               totalJuryWeight += u.reputation[proposal.committeeId]!;
            }
            if (u.reputation) {
                totalJuryWeight += Object.values(u.reputation).reduce((a, b) => a + b, 0) * 0.1;
            }
        }
    }

    // Default weight threshold (can be adjusted later to be proposal specific)
    const weightThreshold = required * 1.5;

    if (votes.length >= required || totalJuryWeight >= weightThreshold) {
      this.releaseMilestoneFunds(proposalId, milestoneId);
    }
  }

  releaseMilestoneFunds(proposalId: string, milestoneId: string): boolean {
    const proposal = this.store.getProposal(proposalId);
    if (!proposal) return false;

    const milestone = proposal.milestones.find(m => m.id === milestoneId);
    if (!milestone || milestone.isCompleted) return false;

    const votes = milestone.juryVotes || [];
    const required = milestone.requiredJuryQuorum || 0;
    if (votes.length < required) {
      return false;
    }

    const updatedMilestones = proposal.milestones.map(m =>
      m.id === milestoneId ? { ...m, isCompleted: true } : m
    );

    this.store.updateProposal(proposalId, {
      milestones: updatedMilestones,
      status: 'IN_PROGRESS'
    });

    console.log(`Released ${milestone.targetBudget} for milestone ${milestone.description}`);

    const committee = this.store.getCommittee(proposal.committeeId);
    const subject = committee?.subject || 'General';
    globalIdentity.rewardReputation(proposal.proposerId, subject, 5);

    votes.forEach(uid => {
      globalIdentity.rewardReputation(uid, subject, 1);
    });

    if (updatedMilestones.every(m => m.isCompleted)) {
      this.store.updateProposal(proposalId, { status: 'COMPLETED' });
      globalIdentity.rewardReputation(proposal.proposerId, subject, 10);
    }

    return true;
  }

  getContributions(proposalId: string): Contribution[] {
    return this.contributions.get(proposalId) || [];
  }
}
