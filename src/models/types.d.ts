/**
 * Core Data Models for LiquidGov
 */
export type ProposalStatus = 'DRAFT' | 'SPONSORED' | 'ACTIVE_VOTING' | 'FUNDED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED';
export interface Milestone {
    id: string;
    description: string;
    targetBudget: number;
    isCompleted: boolean;
    completionProof?: string;
}
export interface User {
    id: string;
    name: string;
    voiceCredits: number;
    reputation: Record<string, number>;
    delegates: Record<string, string>;
}
export interface Committee {
    id: string;
    subject: string;
    members: string[];
    thresholdQuorum: number;
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
    impactScore?: number;
    executionPayload: string;
}
//# sourceMappingURL=types.d.ts.map