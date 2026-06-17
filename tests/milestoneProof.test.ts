import { CrowdfundingEngine } from '../src/core/crowdfunding';
import { globalStore } from '../src/models/Store';
import { Proposal } from '../src/models/types';

describe('Milestone Proof of Work', () => {
  const engine = new CrowdfundingEngine(globalStore);

  beforeEach(() => {
    globalStore.clear();
  });

  it('should allow submitting proof of work for a milestone', () => {
    const proposal: Proposal = {
      id: 'prop-1',
      title: 'Test Prop',
      abstract: 'Abstract',
      detailedSpecs: 'Specs',
      proposerId: 'user-1',
      committeeId: 'comm-1',
      status: 'IN_PROGRESS',
      milestones: [
        { id: 'm1', description: 'Milestone 1', targetBudget: 100, isCompleted: false }
      ],
      totalTargetBudget: 100,
      currentFunding: 100,
      tokenSymbol: 'USD',
      votesFor: 0,
      votesAgainst: 0,
      executionPayload: '{}'
    };
    globalStore.addProposal(proposal);

    engine.submitMilestoneProof('prop-1', 'm1', 'https://proof.url/123');

    const updated = globalStore.getProposal('prop-1');
    expect(updated).toBeDefined();
    expect(updated?.milestones[0]?.completionProof).toBe('https://proof.url/123');
  });

  it('should throw error if proposal not found', () => {
    expect(() => {
      engine.submitMilestoneProof('non-existent', 'm1', 'https://proof.url');
    }).toThrow('Proposal not found');
  });
});
