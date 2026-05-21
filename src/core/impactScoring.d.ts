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
export declare function calculateImpactScore(proposal: Proposal): number;
/**
 * Sorts proposals by their impact score.
 */
export declare function sortByImpact(proposals: Proposal[]): Proposal[];
//# sourceMappingURL=impactScoring.d.ts.map