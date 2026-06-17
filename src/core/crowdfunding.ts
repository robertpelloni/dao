import { Store } from '../models/Store';
import { TreasuryManager } from './treasury';
import { globalIdentity } from './identity';
import { Contribution } from '../models/types';

/**
 * Crowdfunding and Escrow Engine
 *
 * Manages financial contributions to proposals and their release based on milestones.
 * Implements Dominant Assurance logic where funds are held in escrow and returned if the goal isn't met.
 */

import { IdentityManager } from './identity';

export class CrowdfundingEngine {
  // Map<proposalId, Contribution[]>
  private contributions: Map<string, Contribution[]> = new Map();
  private treasury: TreasuryManager;
  private identity: IdentityManager;

  constructor(private store: Store) {
    this.treasury = new TreasuryManager(store);
    this.identity = new IdentityManager(store);
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
      tokenSymbol: proposal.tokenSymbol || 'USD',
      timestamp: Date.now()
    };

    const list = this.contributions.get(proposalId) || [];
    list.push(contribution);
    this.contributions.set(proposalId, list);

    // Update proposal state
    this.store.updateProposal(proposalId, {
      currentFunding: (proposal.currentFunding || 0) + amount
    });

    // Persist contribution for security analysis
    this.store.addContribution({
      userId,
      proposalId,
      amount,
      tokenSymbol: contribution.tokenSymbol,
      timestamp: contribution.timestamp
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
      // Calculate matching funds from persistent store
      const pContributions = this.store.getContributionsByProposal(proposalId);
      const match = this.treasury.calculateMatch(pContributions);

      // Determine subject from committee
      const committee = this.store.getCommittee(proposal.committeeId);
      const subject = committee?.subject || 'General';

      // Deduct from matching pool if available
      const symbol = proposal.tokenSymbol || 'USD';

      // Try subject-specific pool first, then General
      let pool = this.treasury.getPoolBalance(symbol, subject);
      let targetSubject = subject;

      if (pool <= 0 && subject !== 'General') {
        pool = this.treasury.getPoolBalance(symbol, 'General');
        targetSubject = 'General';
      }

      const actualMatch = Math.min(match, pool);

      if (actualMatch > 0) {
        this.treasury.setMatchingPool(pool - actualMatch, symbol, targetSubject);
        this.store.addTreasuryTransaction({
          id: `tx-match-${proposalId}-${Date.now()}`,
          tokenSymbol: symbol,
          subject: targetSubject,
          amount: -actualMatch,
          type: 'MATCH_ALLOCATION',
          description: `Matching funds for proposal ${proposalId} (routed via ${targetSubject} pool)`,
          timestamp: Date.now()
        });
      }

      // Assign experts and random juries for all milestones
      const allUsers = this.store.getUsers();
      const verifiedHumans = allUsers.filter(u => globalIdentity.isVerified(u.id));

      const updatedMilestones = proposal.milestones.map(m => {
        // Prioritize experts (rep > 0 in subject)
        const experts = verifiedHumans
          .filter(u => (u.reputation[subject] || 0) > 0)
          .map(u => u.id);

        const others = verifiedHumans
          .filter(u => (u.reputation[subject] || 0) === 0)
          .map(u => u.id);

        // Select up to 3 jury members, favoring experts
        const jury = [...experts].sort(() => 0.5 - Math.random()).slice(0, 2);

        if (jury.length < 3) {
          const needed = 3 - jury.length;
          const fillers = others.sort(() => 0.5 - Math.random()).slice(0, needed);
          jury.push(...fillers);
        }

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
  voteOnMilestone(proposalId: string, milestoneId: string, userId: string, action: 'APPROVE' | 'REJECT' = 'APPROVE'): void {
    const proposal = this.store.getProposal(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    const milestones = [...proposal.milestones];
    const index = milestones.findIndex(m => m.id === milestoneId);
    if (index === -1) throw new Error('Milestone not found');

    const milestone = milestones[index]!;
    const votes = [...(milestone.juryVotes || [])];
    const rejectionVotes = [...(milestone.rejectionVotes || [])];
    const assigned = milestone.assignedJury || [];

    if (assigned.length > 0 && !assigned.includes(userId)) {
      throw new Error('User is not an assigned jury member for this milestone');
    }

    if (votes.includes(userId) || rejectionVotes.includes(userId)) {
      throw new Error('User already voted on this milestone');
    }

    const committee = this.store.getCommittee(proposal.committeeId);
    const subject = committee?.subject || 'General';

    if (action === 'APPROVE') {
      votes.push(userId);
      milestone.juryVotes = votes;
    } else {
      rejectionVotes.push(userId);
      milestone.rejectionVotes = rejectionVotes;
    }

    milestones[index] = milestone;
    this.store.updateProposal(proposalId, { milestones });

    // Calculate weighted totals
    const getWeighted = (vids: string[]) => {
      return vids.reduce((total, vid) => {
        const vUser = this.store.getUser(vid);
        const rep = vUser?.reputation[subject] || 0;
        return total + (rep >= 10 ? 2 : 1);
      }, 0);
    };

    const approvalWeighted = getWeighted(votes);
    const rejectionWeighted = getWeighted(rejectionVotes);

    // Emergency logic: Quorum is halved for emergency proposals
    let required = milestone.requiredJuryQuorum || 2;
    if (proposal.status === 'EMERGENCY' || proposal.status === 'ACTIVE_VOTING') {
       // Check if the actual flag was set during creation or triage
       if (proposal.id.includes('emerg')) {
          required = Math.max(1, Math.floor(required / 2));
       }
    }

    // Handle Rejection/Dispute
    if (rejectionWeighted >= required) {
      milestones[index] = { ...milestone, isDisputed: true, juryVotes: [], rejectionVotes: [] };
      this.store.updateProposal(proposalId, { milestones });

      // Slash reputation for dispute
      this.identity.rewardReputation(proposal.proposerId, subject, -10);
      console.warn(`[DISPUTE] Milestone ${milestoneId} rejected. Proposer ${proposal.proposerId} slashed.`);
      return;
    }

    // Handle Approval
    if (approvalWeighted >= required) {
      this.releaseMilestoneFunds(proposalId, milestoneId);
    }
  }

  /**
   * Release funds for a specific milestone.
   * Only works if proposal is FUNDED or IN_PROGRESS.
   */
  releaseMilestoneFunds(proposalId: string, milestoneId: string, bypassQuorum: boolean = false): boolean {
    const proposal = this.store.getProposal(proposalId);
    if (!proposal) return false;

    const milestone = proposal.milestones.find(m => m.id === milestoneId);
    if (!milestone || milestone.isCompleted) return false;

    // Verify jury consensus (Weighted)
    const committee = this.store.getCommittee(proposal.committeeId);
    const subject = committee?.subject || 'General';
    const votes = milestone.juryVotes || [];

    if (!bypassQuorum) {
      let weightedTotal = 0;
      votes.forEach(vid => {
        const vUser = this.store.getUser(vid);
        const rep = vUser?.reputation[subject] || 0;
        weightedTotal += (rep >= 10) ? 2 : 1;
      });

      const required = milestone.requiredJuryQuorum || 0;
      if (weightedTotal < required) {
        return false;
      }
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
    this.identity.rewardReputation(proposal.proposerId, subject, 5);

    // Reward jury members
    votes.forEach(uid => {
      this.identity.rewardReputation(uid, subject, 1);
    });

    // Check if all milestones are done
    if (updatedMilestones.every(m => m.isCompleted)) {
      this.store.updateProposal(proposalId, { status: 'COMPLETED' });
      // Bonus reputation for full project success
      this.identity.rewardReputation(proposal.proposerId, subject, 10);
    }

    return true;
  }

  /**
   * Resolves a disputed milestone.
   */
  resolveDispute(proposalId: string, milestoneId: string, resolution: 'RELEASE' | 'REJECT'): boolean {
    const proposal = this.store.getProposal(proposalId);
    if (!proposal) return false;

    const milestones = [...proposal.milestones];
    const index = milestones.findIndex(m => m.id === milestoneId);
    if (index === -1) return false;

    const milestone = milestones[index]!;
    if (!milestone.isDisputed) return false;

    const committee = this.store.getCommittee(proposal.committeeId);
    const subject = committee?.subject || 'General';

    if (resolution === 'RELEASE') {
      // Transition out of dispute and release funds
      milestones[index] = { ...milestone, isDisputed: false, juryVotes: [], rejectionVotes: [] };
      this.store.updateProposal(proposalId, { milestones });

      // Partial reputation restoration (5 points)
      this.identity.rewardReputation(proposal.proposerId, subject, 5);
      console.log(`[DISPUTE RESOLVED] Milestone ${milestoneId} released. Proposer reputation partially restored.`);

      return this.releaseMilestoneFunds(proposalId, milestoneId, true);
    } else {
      // Permanent rejection: do not release funds, keep isDisputed but perhaps mark as terminal failure
      milestones[index] = { ...milestone, isCompleted: false, isDisputed: true }; // Keep as record
      this.store.updateProposal(proposalId, { status: 'REJECTED', milestones });
      console.log(`[DISPUTE RESOLVED] Milestone ${milestoneId} permanently rejected. Proposal halted.`);
      return true;
    }
  }

  /**
   * Submit proof of completion for a milestone.
   */
  submitMilestoneProof(proposalId: string, milestoneId: string, proofUrl: string): void {
    const proposal = this.store.getProposal(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    const updatedMilestones = proposal.milestones.map(m =>
      m.id === milestoneId ? { ...m, completionProof: proofUrl } : m
    );

    this.store.updateProposal(proposalId, { milestones: updatedMilestones });
    console.log(`Proof submitted for milestone ${milestoneId} of proposal ${proposalId}: ${proofUrl}`);
  }

  getContributions(proposalId: string): Contribution[] {
    return this.contributions.get(proposalId) || [];
  }
}
