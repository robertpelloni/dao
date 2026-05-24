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
  detectRedundancy(title: string, existingTitles: string[]): boolean {
    const normalized = title.toLowerCase().trim();
    return existingTitles.some(t => t.toLowerCase().trim() === normalized);
  }
}

export const globalTriage = new TriageAgent();
