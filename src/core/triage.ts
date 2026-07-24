import { Committee } from '../models/types';

/**
 * AI Proposal Triage Agent
 *
 * Provides automated committee suggestions and tagging for new proposals
 * using keyword-based subject matching.
 */
export class TriageAgent {
  /**
   * Suggests the most relevant committee for a given proposal.
   */
  suggestCommittee(title: string, abstract: string, committees: Committee[]): Committee | undefined {
    const text = `${title} ${abstract}`.toLowerCase();
    let bestMatch: Committee | undefined;
    let maxScore = 0;

    committees.forEach(committee => {
      const subjectParts = committee.subject.toLowerCase().split(/[->\s]+/);
      let score = 0;

      subjectParts.forEach(part => {
        if (part.length > 2 && text.includes(part)) {
          score += 1;
        }
      });

      // Special case: singular/plural and common variations
      if (text.includes('school') && committee.subject.toLowerCase().includes('school')) score += 1;

      if (score > maxScore) {
        maxScore = score;
        bestMatch = committee;
      }
    });

    return maxScore > 0 ? bestMatch : undefined;
  }

  /**
   * Identifies potential redundancies by comparing a draft to existing proposals.
   * (Placeholder for future NLP expansion)
   */
/**
   * Prototype: Emergency Governance Fast-Track
   * Analyzes proposals for extreme urgency keywords or crisis heuristics.
   * If flagged, the proposal bypasses standard curation epochs and immediately
   * triggers weighted juries composed of highest-reputation delegates.
   */
  evaluateEmergencyFastTrack(title: string, abstract: string): boolean {
    const text = `${title} ${abstract}`.toLowerCase();
    const emergencyKeywords = ['crisis', 'emergency', 'critical vulnerability', 'exploit', 'immediate action required'];

    for (const keyword of emergencyKeywords) {
      if (text.includes(keyword)) {
        console.log(`[TriageAgent] EMERGENCY FAST-TRACK TRIGGERED: Identified keyword '${keyword}'`);
        return true;
      }
    }
    return false;
  }

  /**
   * Calculate Engagement Velocity and flag for Fast-Track.
   * Velocity is a combination of funding velocity and voting velocity over time.
   * If engagementVelocity > 80%, proposal is flagged as fast-track eligible.
   * Returns updated engagement velocity.
   */
  calculateEngagementVelocity(proposal: any, store: any): number {
    if (!proposal) return 0;

    const fundingVelocity = proposal.totalTargetBudget > 0
      ? (proposal.currentFunding / proposal.totalTargetBudget) * 50
      : 0;

    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const voteVelocity = Math.min((totalVotes / 10) * 50, 50); // Lower quorum assumption for velocity metric

    const velocity = fundingVelocity + voteVelocity;
    return velocity;
  }

  detectRedundancy(title: string, existingTitles: string[]): boolean {
    const normalized = title.toLowerCase().trim();
    return existingTitles.some(t => t.toLowerCase().trim() === normalized);
  }
}

export const globalTriage = new TriageAgent();
