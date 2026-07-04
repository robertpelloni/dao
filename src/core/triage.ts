import { Committee, Proposal } from '../models/types';

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
   * Uses fuzzy matching (Jaccard similarity on word sets).
   */
  detectRedundancy(title: string, existingTitles: string[]): boolean {
    const normalized = title.toLowerCase().trim();
    const words = new Set(normalized.split(/\s+/).filter(w => w.length > 2));

    if (words.size === 0) return false;

    return existingTitles.some(t => {
      const otherNormalized = t.toLowerCase().trim();
      if (normalized === otherNormalized) return true;

      const otherWords = new Set(otherNormalized.split(/\s+/).filter(w => w.length > 2));
      if (otherWords.size === 0) return false;

      // Calculate Jaccard Similarity
      const intersection = new Set([...words].filter(w => otherWords.has(w)));
      const union = new Set([...words, ...otherWords]);
      const similarity = intersection.size / union.size;

      // Threshold of 0.6 for redundancy warning
      return similarity > 0.6;
    });
  }

  /**
   * Suggests and ranks proposals for a specific user based on their reputation.
   */
  suggestProposalsForUser(user: { reputation?: Record<string, number> }, allProposals: Proposal[], committees: Committee[]): Proposal[] {
    const rep: Record<string, number> | undefined = user.reputation;
    if (!rep) return [];
    const userSubjects = Object.keys(rep).filter(s => (rep[s] || 0) > 0);
    if (userSubjects.length === 0) return [];

    // Map committee IDs to subjects for quick lookup
    const committeeToSubject = new Map<string, string>();
    committees.forEach(c => committeeToSubject.set(c.id, c.subject));

    return allProposals
      .filter(p => p.status === 'ACTIVE_VOTING')
      .map(p => {
        const proposalSubject = committeeToSubject.get(p.committeeId) || 'General';
        let score = rep[proposalSubject] || 0;

        // Boost score if the subject is a partial match (e.g. user has rep in "Infrastructure" and proposal is "Infrastructure -> Roads")
        userSubjects.forEach(us => {
          if (proposalSubject.includes(us) && us !== proposalSubject) {
            score += (rep[us] || 0) * 0.5;
          }
        });

        return { proposal: p, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.proposal);
  }
}

export const globalTriage = new TriageAgent();
