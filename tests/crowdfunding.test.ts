import { Store } from '../src/models/Store';
import { CrowdfundingEngine } from '../src/core/crowdfunding';
import { Proposal } from '../src/models/types';

describe('Crowdfunding and Escrow Engine', () => {
  let store: Store;
  let engine: CrowdfundingEngine;

  beforeEach(() => {
    store = new Store();
    engine = new CrowdfundingEngine(store);

    const proposal: Proposal = {
      id: 'prop-1',
      title: 'Fix the Bridge',
      abstract: '...',
      detailedSpecs: '...',
      proposerId: 'user-1',
      committeeId: 'comm-1',
      status: 'ACTIVE_VOTING',
      milestones: [
        { id: 'm1', description: 'Survey', targetBudget: 500, isCompleted: false },
        { id: 'm2', description: 'Build', targetBudget: 1500, isCompleted: false }
      ],
      totalTargetBudget: 2000, tokenSymbol: "USD",
      currentFunding: 0,
      votesFor: 0,
      votesAgainst: 0,
      executionPayload: '{}'
    };
    store.addProposal(proposal);
  });

  test('should accept contributions and update proposal funding', () => {
    engine.contribute('user-2', 'prop-1', 500);
    const prop = store.getProposal('prop-1');
    expect(prop?.currentFunding).toBe(500);
    expect(engine.getContributions('prop-1').length).toBe(1);
  });

  test('finalizeFunding should set status to FUNDED if goal met', () => {
    engine.contribute('user-2', 'prop-1', 2000);
    const success = engine.finalizeFunding('prop-1');
    expect(success).toBe(true);
    expect(store.getProposal('prop-1')?.status).toBe('FUNDED');
  });

  test('finalizeFunding should refund and set REJECTED if goal not met', () => {
    engine.contribute('user-2', 'prop-1', 1000);
    const success = engine.finalizeFunding('prop-1');
    expect(success).toBe(false);
    expect(store.getProposal('prop-1')?.status).toBe('REJECTED');
    expect(store.getProposal('prop-1')?.currentFunding).toBe(0);
  });

  test('releaseMilestoneFunds should update milestone and status', () => {
    engine.contribute('user-2', 'prop-1', 2000);
    engine.finalizeFunding('prop-1');

    engine.releaseMilestoneFunds('prop-1', 'm1');
    const prop = store.getProposal('prop-1');
    expect(prop?.milestones?.[0]?.isCompleted).toBe(true);
    expect(prop?.status).toBe('IN_PROGRESS');
  });

  test('proposal should be COMPLETED when all milestones are done', () => {
    engine.contribute('user-2', 'prop-1', 2000);
    engine.finalizeFunding('prop-1');

    engine.releaseMilestoneFunds('prop-1', 'm1');
    engine.releaseMilestoneFunds('prop-1', 'm2');
    const prop = store.getProposal('prop-1');
    expect(prop?.status).toBe('COMPLETED');
  });
});
