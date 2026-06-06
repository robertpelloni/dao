import { Store } from '../src/models/Store';
import { CrowdfundingEngine } from '../src/core/crowdfunding';
import { Proposal } from '../src/models/types';

describe('Milestone Oracle System (Jury Voting)', () => {
  let store: Store;
  let engine: CrowdfundingEngine;

  const sampleProposal: Proposal = {
    id: 'prop-jury-1',
    title: 'Test Proposal',
    abstract: 'Abstract',
    detailedSpecs: 'Specs',
    proposerId: 'alice',
    committeeId: 'test-committee',
    status: 'FUNDED',
    milestones: [
      {
        id: 'm1',
        description: 'Milestone 1',
        targetBudget: 1000,
        isCompleted: false,
        requiredJuryQuorum: 2,
        juryVotes: []
      }
    ],
    totalTargetBudget: 1000, tokenSymbol: "USD",
    currentFunding: 1000,
    votesFor: 0,
    votesAgainst: 0,
    executionPayload: '{}'
  };

  beforeEach(() => {
    store = new Store(':memory:');
    engine = new CrowdfundingEngine(store);
    store.addProposal(sampleProposal);
  });

  it('should allow users to vote on a milestone', () => {
    engine.voteOnMilestone('prop-jury-1', 'm1', 'user1');
    const proposal = store.getProposal('prop-jury-1');
    expect(proposal?.milestones?.[0]?.juryVotes).toContain('user1');
    expect(proposal?.milestones?.[0]?.isCompleted).toBe(false);
  });

  it('should not allow duplicate votes from the same user', () => {
    engine.voteOnMilestone('prop-jury-1', 'm1', 'user1');
    expect(() => engine.voteOnMilestone('prop-jury-1', 'm1', 'user1')).toThrow('User already voted on this milestone');
  });

  it('should release funds only after reaching quorum', () => {
    engine.voteOnMilestone('prop-jury-1', 'm1', 'user1');
    expect(store.getProposal('prop-jury-1')?.milestones?.[0]?.isCompleted).toBe(false);

    engine.voteOnMilestone('prop-jury-1', 'm1', 'user2');
    const proposal = store.getProposal('prop-jury-1');
    expect(proposal?.milestones?.[0]?.isCompleted).toBe(true);
    expect(proposal?.status).toBe('COMPLETED'); // Since it's the only milestone
  });

  it('should not release funds via releaseMilestoneFunds if quorum is not met', () => {
    const success = engine.releaseMilestoneFunds('prop-jury-1', 'm1');
    expect(success).toBe(false);
    expect(store.getProposal('prop-jury-1')?.milestones?.[0]?.isCompleted).toBe(false);
  });
});
