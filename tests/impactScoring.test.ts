import { calculateImpactScore } from '../src/core/impactScoring';
import { Proposal } from '../src/models/types';

describe('Impact Scoring Heuristics', () => {
  const baseProposal: Proposal = {
    id: 'prop-1',
    title: 'Test',
    abstract: 'Short',
    detailedSpecs: 'Short specs',
    proposerId: 'u1',
    committeeId: 'c1',
    status: 'DRAFT',
    milestones: [{ id: 'm1', description: 'One', targetBudget: 1000, isCompleted: false }],
    totalTargetBudget: 1000, tokenSymbol: "USD",
    currentFunding: 0,
    votesFor: 0,
    votesAgainst: 0,
    executionPayload: ''
  };

  test('should give a higher score for efficient budgets', () => {
    const efficient = { ...baseProposal, totalTargetBudget: 400 };
    const expensive = { ...baseProposal, totalTargetBudget: 10000 };

    expect(calculateImpactScore(efficient)).toBeGreaterThan(calculateImpactScore(expensive));
  });

  test('should give a higher score for more milestones (better planning)', () => {
    const complex = { ...baseProposal, milestones: [
      { id: 'm1', description: 'A', targetBudget: 333, isCompleted: false },
      { id: 'm2', description: 'B', targetBudget: 333, isCompleted: false },
      { id: 'm3', description: 'C', targetBudget: 333, isCompleted: false }
    ]};

    expect(calculateImpactScore(complex)).toBeGreaterThan(calculateImpactScore(baseProposal));
  });

  test('should clamp score between 0 and 100', () => {
    const score = calculateImpactScore(baseProposal);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
