import { Store } from '../models/Store';
import { TreasuryManager } from './treasury';
import { globalIdentity } from './identity';

/**
 * Crowdfunding and Escrow Engine
 *
 * Manages financial contributions to proposals and their release based on milestones.
 * Implements Dominant Assurance logic where funds are held in escrow and returned if the goal isn't met.
 */

export interface Contribution {
  userId: string;
  proposalId: string;
  amount: number;
  timestamp: number;
}

export class CrowdfundingEngine {
  // Map<proposalId, Contribution[]>
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
  contribute(userId: string, proposalId: string, amount: number): void {
    const proposal = this.store.getProposal(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    const contribution: Contribution = {
      userId,
      proposalId,
      amount,
      timestamp: Date.now()
    };

    const list = this.contributions.get(proposalId) || [];
    list.push(contribution);
    this.contributions.set(proposalId, list);

    // Update proposal state
    this.store.updateProposal(proposalId, {
      currentFunding: (proposal.currentFunding || 0) + amount
    });
  }

  /**
   * Finalize funding for a proposal.
   * If target is met, it stays FUNDED.
   * If target is not met, it triggers refunds.
   */
  finalizeFunding(proposalId: string): boolean {
    const proposal = this.store.getProposal(proposalId);
    if (!proposal) return false;

    if (proposal.currentFunding >= proposal.totalTargetBudget) {
      // Calculate matching funds
      const pContributions = this.contributions.get(proposalId) || [];
      const match = this.treasury.calculateMatch(pContributions);

      // Assign random juries for all milestones
      const verifiedHumans = this.store.getUsers().filter(u => globalIdentity.isVerified(u.id)).map(u => u.id);
      const updatedMilestones = proposal.milestones.map(m => {
        // Randomly select 3 citizens for each milestone if possible
        const jury = [...verifiedHumans].sort(() => 0.5 - Math.random()).slice(0, 3);
        return { ...m, assignedJury: jury, requiredJuryQuorum: Math.min(jury.length, 2) };
      });

      this.store.updateProposal(proposalId, {
        status: 'FUNDED',
        currentFunding: proposal.currentFunding + match,
        milestones: updatedMilestones
      });
      return true;
    } else {
      this.refund(proposalId);
      this.store.updateProposal(proposalId, { status: 'REJECTED' });
      return false;
    }
  }

  /**
   * Returns funds to all contributors for a specific proposal.
   */
  private refund(proposalId: string): void {
    const list = this.contributions.get(proposalId) || [];
    // In a real system, we would execute actual financial transactions here.
    console.log(`Refunding ${list.length} contributors for proposal ${proposalId}`);
    this.contributions.delete(proposalId);
    this.store.updateProposal(proposalId, { currentFunding: 0 });
  }

  /**
   * Vote on a milestone as a jury member.
   */
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

    // Auto-trigger release if quorum is met
    const required = milestone.requiredJuryQuorum || 1;
    if (votes.length >= required) {
      this.releaseMilestoneFunds(proposalId, milestoneId);
    }
  }

  /**
   * Release funds for a specific milestone.
   * Only works if proposal is FUNDED or IN_PROGRESS.
   */
  releaseMilestoneFunds(proposalId: string, milestoneId: string): boolean {
    const proposal = this.store.getProposal(proposalId);
    if (!proposal) return false;

    const milestone = proposal.milestones.find(m => m.id === milestoneId);
    if (!milestone || milestone.isCompleted) return false;

    // Verify jury consensus if required
    const votes = milestone.juryVotes || [];
    const required = milestone.requiredJuryQuorum || 0;
    if (votes.length < required) {
      return false;
    }

    // Mark milestone as completed
    const updatedMilestones = proposal.milestones.map(m =>
      m.id === milestoneId ? { ...m, isCompleted: true } : m
    );

    this.store.updateProposal(proposalId, {
      milestones: updatedMilestones,
      status: 'IN_PROGRESS'
    });

    console.log(`Released ${milestone.targetBudget} for milestone ${milestone.description}`);

    // Reward proposer with reputation for milestone completion
    const committee = this.store.getCommittee(proposal.committeeId);
    const subject = committee?.subject || 'General';
    globalIdentity.rewardReputation(proposal.proposerId, subject, 5);

    // Reward jury members
    votes.forEach(uid => {
      globalIdentity.rewardReputation(uid, subject, 1);
    });

    // Check if all milestones are done
    if (updatedMilestones.every(m => m.isCompleted)) {
      this.store.updateProposal(proposalId, { status: 'COMPLETED' });
      // Bonus reputation for full project success
      globalIdentity.rewardReputation(proposal.proposerId, subject, 10);
    }

    return true;
  }

  getContributions(proposalId: string): Contribution[] {
    return this.contributions.get(proposalId) || [];
  }
}
