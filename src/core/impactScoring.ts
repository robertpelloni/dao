import { Proposal } from '../models/types';

/**
 * AI Impact Scoring Heuristics
 *
 * In a production system, this might involve a Large Language Model analyzing
 * the proposal text and comparing it against community goals.
 *
 * For this PoC, we use a heuristic based on:
 * 1. Budget Efficiency (Cost per milestone)
 * 2. Complexity (Number of milestones)
 * 3. Proposer Reputation (Future integration)
 * 4. Subject Node Urgency (Mocked)
 */

export function calculateImpactScore(proposal: Proposal): number {
  let score = 50; // Base score

  // 1. Budget Efficiency: Lower budget per milestone increases score
  const avgBudgetPerMilestone = proposal.totalTargetBudget / (proposal.milestones.length || 1);
  if (avgBudgetPerMilestone < 500) score += 10;
  if (avgBudgetPerMilestone > 5000) score -= 10;

  // 2. Complexity: More milestones suggest better planning
  if (proposal.milestones.length >= 3) score += 15;
  if (proposal.milestones.length === 1) score -= 5;

  // 3. Completeness: Detailed specs boost score
  if (proposal.detailedSpecs.length > 500) score += 10;
  if (proposal.abstract.length > 100) score += 5;

  // Clamp score between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Sorts proposals by their impact score.
 */
export function sortByImpact(proposals: Proposal[]): Proposal[] {
  return [...proposals].sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));
}

/**
 * Advanced Oracle Assessment
 * Incorporates identity confidence (Sybil resistance) and engagement trends.
 */
export function synthesizeOracleAssessment(
  proposal: Proposal,
  engagementVelocity: number,
  sybilThreatLevel: number,
  proposerReputation: number
): number {
  let baseImpact = calculateImpactScore(proposal);

  // Confidence modifiers
  // High Sybil threat degrades the score severely
  const sybilPenalty = sybilThreatLevel > 0 ? (sybilThreatLevel * 10) : 0;

  // High engagement velocity acts as a force multiplier
  const engagementBonus = Math.min(engagementVelocity / 2, 30); // Max +30

  // Proven actors get a slight boost
  const repBonus = proposerReputation > 50 ? 10 : 0;

  const finalScore = baseImpact - sybilPenalty + engagementBonus + repBonus;

  return Math.max(0, Math.min(100, finalScore));
}
