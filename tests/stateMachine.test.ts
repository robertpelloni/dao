import { transitionProposal, InvalidStateTransitionError, canTransition } from '../src/core/proposalStateMachine';
import { Proposal } from '../src/models/types';

describe('Proposal State Machine', () => {
  const mockProposal: Proposal = {
    id: 'prop-1',
    title: 'Test Proposal',
    abstract: 'Abstract',
    detailedSpecs: 'Specs',
    proposerId: 'user-1',
    committeeId: 'comm-1',
    status: 'DRAFT',
    milestones: [],
    totalTargetBudget: 1000, tokenSymbol: "USD",
    currentFunding: 0,
    votesFor: 0,
    votesAgainst: 0,
    executionPayload: '{}'
  };

  test('should transition from DRAFT to SPONSORED', () => {
    const updated = transitionProposal(mockProposal, 'SPONSORED');
    expect(updated.status).toBe('SPONSORED');
  });

  test('should throw error on invalid transition (DRAFT -> COMPLETED)', () => {
    expect(() => {
      transitionProposal(mockProposal, 'COMPLETED');
    }).toThrow(InvalidStateTransitionError);
  });

  test('canTransition should correctly report valid transitions', () => {
    expect(canTransition('DRAFT', 'SPONSORED')).toBe(true);
    expect(canTransition('DRAFT', 'ACTIVE_VOTING')).toBe(false);
    expect(canTransition('COMPLETED', 'DRAFT')).toBe(false);
  });

  test('should allow multiple valid transitions in sequence', () => {
    let prop = { ...mockProposal };
    prop = transitionProposal(prop, 'SPONSORED');
    prop = transitionProposal(prop, 'ACTIVE_VOTING');
    prop = transitionProposal(prop, 'FUNDED');
    prop = transitionProposal(prop, 'IN_PROGRESS');
    prop = transitionProposal(prop, 'COMPLETED');
    expect(prop.status).toBe('COMPLETED');
  });
});
