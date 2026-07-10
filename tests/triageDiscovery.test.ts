import { TriageAgent } from '../src/core/triage';
import { Proposal, Committee, User } from '../src/models/types';

describe('TriageAgent - Reputation-based Discovery', () => {
  let triage: TriageAgent;
  let committees: Committee[];
  let proposals: Proposal[];
  let user: { reputation: Record<string, number> };

  beforeEach(() => {
    triage = new TriageAgent();
    committees = [
      { id: 'c1', subject: 'Infrastructure', members: [], thresholdQuorum: 0.05 },
      { id: 'c2', subject: 'Infrastructure -> Roads', members: [], thresholdQuorum: 0.05 },
      { id: 'c3', subject: 'Education', members: [], thresholdQuorum: 0.05 }
    ];
    proposals = [
      {
        id: 'p1',
        title: 'Road Repair',
        abstract: 'Fixing potholes',
        detailedSpecs: '',
        proposerId: 'u1',
        committeeId: 'c2',
        status: 'ACTIVE_VOTING',
        milestones: [],
        totalTargetBudget: 1000,
        currentFunding: 0,
        tokenSymbol: 'USD',
        votesFor: 0,
        votesAgainst: 0,
        executionPayload: '{}'
      },
      {
        id: 'p2',
        title: 'New School',
        abstract: 'Building a school',
        detailedSpecs: '',
        proposerId: 'u2',
        committeeId: 'c3',
        status: 'ACTIVE_VOTING',
        milestones: [],
        totalTargetBudget: 5000,
        currentFunding: 0,
        tokenSymbol: 'USD',
        votesFor: 0,
        votesAgainst: 0,
        executionPayload: '{}'
      },
      {
        id: 'p3',
        title: 'Draft Proposal',
        abstract: 'Not active',
        detailedSpecs: '',
        proposerId: 'u1',
        committeeId: 'c1',
        status: 'DRAFT',
        milestones: [],
        totalTargetBudget: 100,
        currentFunding: 0,
        tokenSymbol: 'USD',
        votesFor: 0,
        votesAgainst: 0,
        executionPayload: '{}'
      }
    ];
  });

  test('should rank proposals based on exact reputation match', () => {
    user = { reputation: { 'Education': 100 } };
    const suggested = triage.suggestProposalsForUser(user, proposals, committees);
    expect(suggested.length).toBe(1);
    expect(suggested[0]?.id).toBe('p2');
  });

  test('should handle partial subject matches with lower score', () => {
    user = { reputation: { 'Infrastructure': 100 } };
    const suggested = triage.suggestProposalsForUser(user, proposals, committees);
    // 'p1' is in 'Infrastructure -> Roads' which contains 'Infrastructure'
    expect(suggested.length).toBe(1);
    expect(suggested[0]?.id).toBe('p1');
  });

  test('should sort multiple matches by score', () => {
    user = { reputation: { 'Infrastructure -> Roads': 50, 'Education': 100 } };
    const suggested = triage.suggestProposalsForUser(user, proposals, committees);
    expect(suggested.length).toBe(2);
    expect(suggested[0]?.id).toBe('p2'); // Score 100
    expect(suggested[1]?.id).toBe('p1'); // Score 50
  });

  test('should return empty array if user has no reputation', () => {
    user = { reputation: {} };
    const suggested = triage.suggestProposalsForUser(user, proposals, committees);
    expect(suggested.length).toBe(0);
  });
});
