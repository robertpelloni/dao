import { Proposal, ProposalStatus } from '../models/types';

/**
 * Valid state transitions for a Proposal.
 */
const VALID_TRANSITIONS: Record<ProposalStatus, ProposalStatus[]> = {
  'DRAFT': ['SPONSORED'],
  'SPONSORED': ['ACTIVE_VOTING', 'REJECTED'],
  'ACTIVE_VOTING': ['FUNDED', 'REJECTED'],
  'FUNDED': ['IN_PROGRESS', 'REJECTED'], // Can be rejected if found fraudulent before starting
  'REJECTED': [],
  'IN_PROGRESS': ['COMPLETED', 'REJECTED'], // Can be rejected if it fails mid-progress
  'COMPLETED': []
};

/**
 * Error thrown when an invalid transition is attempted.
 */
export class InvalidStateTransitionError extends Error {
  constructor(from: ProposalStatus, to: ProposalStatus) {
    super(`Invalid state transition from ${from} to ${to}`);
    this.name = 'InvalidStateTransitionError';
  }
}

/**
 * Transition a proposal to a new status.
 *
 * @param proposal The proposal to transition
 * @param newStatus The target status
 * @returns The updated proposal
 * @throws InvalidStateTransitionError if the transition is not allowed
 */
export function transitionProposal(proposal: Proposal, newStatus: ProposalStatus): Proposal {
  const allowed = VALID_TRANSITIONS[proposal.status];

  if (!allowed.includes(newStatus)) {
    throw new InvalidStateTransitionError(proposal.status, newStatus);
  }

  return {
    ...proposal,
    status: newStatus
  };
}

/**
 * Checks if a proposal can transition to a new status.
 */
export function canTransition(currentStatus: ProposalStatus, newStatus: ProposalStatus): boolean {
  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
}
