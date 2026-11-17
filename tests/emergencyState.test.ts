import { transitionProposal, canTransition } from '../src/core/proposalStateMachine';
import { Proposal, ProposalStatus } from '../src/models/types';

describe('Emergency Proposal State Transitions', () => {
  let proposal: Proposal;

  beforeEach(() => {
    proposal = {
      id: 'prop-1',
      title: 'Emergency Leak',
      abstract: 'Water main burst',
      detailedSpecs: '',
      proposerId: 'u1',
      committeeId: 'c1',
      status: 'DRAFT',
      milestones: [],
      totalTargetBudget: 1000,
      currentFunding: 0,
      tokenSymbol: 'USD',
      votesFor: 0,
      votesAgainst: 0,
      executionPayload: '{}'
    };
  });

  test('should allow transition from DRAFT to EMERGENCY', () => {
    const updated = transitionProposal(proposal, 'EMERGENCY');
    expect(updated.status).toBe('EMERGENCY');
  });

  test('should allow transition from EMERGENCY to ACTIVE_VOTING', () => {
    proposal.status = 'EMERGENCY';
    const updated = transitionProposal(proposal, 'ACTIVE_VOTING');
    expect(updated.status).toBe('ACTIVE_VOTING');
  });

  test('should allow transition from EMERGENCY to REJECTED', () => {
    proposal.status = 'EMERGENCY';
    const updated = transitionProposal(proposal, 'REJECTED');
    expect(updated.status).toBe('REJECTED');
  });

  test('should NOT allow transition from EMERGENCY to FUNDED directly', () => {
    proposal.status = 'EMERGENCY';
    expect(() => transitionProposal(proposal, 'FUNDED')).toThrow();
  });

  test('FAST_TRACKED: EMERGENCY escalates, then jury resolves to FUNDED or REJECTED', () => {
    proposal.status = 'EMERGENCY';
    expect(transitionProposal(proposal, 'FAST_TRACKED').status).toBe('FAST_TRACKED');
    proposal.status = 'FAST_TRACKED';
    expect(transitionProposal(proposal, 'FUNDED').status).toBe('FUNDED');
    expect(transitionProposal(proposal, 'REJECTED').status).toBe('REJECTED');
    // Fast-track bypasses QV: no route back into voting, and DRAFT cannot skip EMERGENCY.
    expect(canTransition('FAST_TRACKED', 'ACTIVE_VOTING')).toBe(false);
    expect(canTransition('DRAFT', 'FAST_TRACKED')).toBe(false);
  });
});
