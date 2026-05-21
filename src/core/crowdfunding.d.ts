import { Store } from '../models/Store';
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
export declare class CrowdfundingEngine {
    private store;
    private contributions;
    constructor(store: Store);
    /**
     * Contribute funds to a proposal.
     */
    contribute(userId: string, proposalId: string, amount: number): void;
    /**
     * Finalize funding for a proposal.
     * If target is met, it stays FUNDED.
     * If target is not met, it triggers refunds.
     */
    finalizeFunding(proposalId: string): boolean;
    /**
     * Returns funds to all contributors for a specific proposal.
     */
    private refund;
    /**
     * Release funds for a specific milestone.
     * Only works if proposal is FUNDED or IN_PROGRESS.
     */
    releaseMilestoneFunds(proposalId: string, milestoneId: string): boolean;
    getContributions(proposalId: string): Contribution[];
}
//# sourceMappingURL=crowdfunding.d.ts.map