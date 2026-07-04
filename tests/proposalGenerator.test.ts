import { Store } from '../src/models/Store';
import { AutonomousProposalGenerator } from '../src/core/proposalGenerator';

describe('Autonomous Proposal Generator', () => {
  let store: Store;
  let generator: AutonomousProposalGenerator;

  beforeEach(() => {
    store = new Store();
    generator = new AutonomousProposalGenerator(store);
  });

  it('should not generate a proposal if no trends exist', () => {
    const proposal = generator.generateAutonomousProposal();
    expect(proposal).toBeNull();
  });

  it('should generate a general proposal if no high activity subjects exist', () => {
    store['db'].prepare('INSERT INTO governance_cycles (number, status, totalVotesCast, totalFundingAllocated) VALUES (?, ?, ?, ?)').run(
      1, 'ARCHIVED',
            100,
      1000
      );


    const proposal = generator.generateAutonomousProposal();
    expect(proposal).not.toBeNull();
    expect(proposal?.title).toContain('Platform General Improvement Initiative');
  });

  it('should generate a targeted proposal based on high activity subjects', () => {
    store['db'].prepare('INSERT INTO governance_cycles (number, status, totalVotesCast, totalFundingAllocated) VALUES (?, ?, ?, ?)').run(
      1, 'ARCHIVED',
            100,
      1000
      );


    store.addVote({
      userId: 'user1',
      proposalId: 'prop1',
      amount: 10,
      subject: 'Education',
      timestamp: Date.now()
    });

    const proposal = generator.generateAutonomousProposal();
    expect(proposal).not.toBeNull();
    expect(proposal?.title).toBeDefined();
});

});