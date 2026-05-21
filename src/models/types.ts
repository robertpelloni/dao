/**
 * Core Data Models for LiquidGov
 */

export type ProposalStatus =
  | 'DRAFT'
  | 'SPONSORED'
  | 'ACTIVE_VOTING'
  | 'FUNDED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export interface Milestone {
  id: string;
  description: string;
  targetBudget: number;
  isCompleted: boolean;
  completionProof?: string; // URL or hash
}

export interface User {
  id: string;
  name: string;
  voiceCredits: number; // For Quadratic Voting
  reputation: Record<string, number>; // Subject-specific reputation
  delegates: Record<string, string>; // subject -> user_id
}

export interface Committee {
  id: string;
  subject: string; // e.g., "Infrastructure -> Roads"
  members: string[]; // user IDs
  thresholdQuorum: number; // e.g., 0.05 for 5%
}

export interface Proposal {
  id: string;
  title: string;
  abstract: string;
  detailedSpecs: string;
  proposerId: string;
  committeeId: string;
  status: ProposalStatus;
  milestones: Milestone[];
  totalTargetBudget: number;
  currentFunding: number;
  votesFor: number;
  votesAgainst: number;
  impactScore?: number; // Calculated by AI/Heuristics
  executionPayload: string; // JSON or script hash
}
