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

  // Autonomous Execution Simulation
  if (newStatus === 'COMPLETED') {
    executeAutonomousPayload(proposal);
  }

  return {
    ...proposal,
    status: newStatus
  };
}

/**
 * Simulates the autonomous execution of a proposal's payload.
 * In a production system, this would be a trustless on-chain execution hook.
 */
function executeAutonomousPayload(proposal: Proposal): void {
  console.log(`[AUTONOMOUS EXECUTION] Triggering payload for Proposal: ${proposal.id}`);
  console.log(`[PAYLOAD]: ${proposal.executionPayload}`);

  // Simulated audit log
  const auditEntry = {
    proposalId: proposal.id,
    timestamp: Date.now(),
    status: 'SUCCESS',
    details: 'Autonomous state transition hook executed successfully.'
  };

  console.log(`[EXECUTION AUDIT]: ${JSON.stringify(auditEntry)}`);
}

/**
 * Checks if a proposal can transition to a new status.
 */
export function canTransition(currentStatus: ProposalStatus, newStatus: ProposalStatus): boolean {
  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
}
