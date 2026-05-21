import { Proposal, ProposalStatus } from '../models/types';
/**
 * Error thrown when an invalid transition is attempted.
 */
export declare class InvalidStateTransitionError extends Error {
    constructor(from: ProposalStatus, to: ProposalStatus);
}
/**
 * Transition a proposal to a new status.
 *
 * @param proposal The proposal to transition
 * @param newStatus The target status
 * @returns The updated proposal
 * @throws InvalidStateTransitionError if the transition is not allowed
 */
export declare function transitionProposal(proposal: Proposal, newStatus: ProposalStatus): Proposal;
/**
 * Checks if a proposal can transition to a new status.
 */
export declare function canTransition(currentStatus: ProposalStatus, newStatus: ProposalStatus): boolean;
//# sourceMappingURL=proposalStateMachine.d.ts.map