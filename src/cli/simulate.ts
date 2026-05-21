import { Store } from '../models/Store';
import { calculateVoteCost, aggregateVotes } from '../core/qv';
import { delegate, calculateEffectivePower } from '../core/delegation';
import { transitionProposal } from '../core/proposalStateMachine';
import { CrowdfundingEngine } from '../core/crowdfunding';
import { User, Proposal, Committee } from '../models/types';

/**
 * LiquidGov Full Lifecycle Simulation
 *
 * This script simulates the full process from user registration to proposal completion.
 */

async function runSimulation() {
  console.log("=== LiquidGov Simulation Start ===\n");
  const store = new Store();
  const crowdfunding = new CrowdfundingEngine(store);

  // 1. Setup Users
  console.log("[1] Registering Users...");
  const alice: User = { id: 'alice', name: 'Alice', voiceCredits: 100, reputation: {}, delegates: {} };
  const bob: User = { id: 'bob', name: 'Bob', voiceCredits: 100, reputation: {}, delegates: {} };
  const charlie: User = { id: 'charlie', name: 'Charlie', voiceCredits: 400, reputation: {}, delegates: {} }; // High net worth / reputation
  const dave: User = { id: 'dave', name: 'Dave (Expert)', voiceCredits: 100, reputation: { 'Roads': 100 }, delegates: {} };

  [alice, bob, charlie, dave].forEach(u => store.addUser(u));
  console.log(`Registered ${store.users.size} users.\n`);

  // 2. Liquid Delegation
  console.log("[2] Setting up Liquid Delegation for 'Roads'...");
  delegate(store, 'alice', 'dave', 'Roads');
  delegate(store, 'bob', 'dave', 'Roads');
  console.log("Alice and Bob delegated their 'Roads' votes to Dave.");

  const davePower = calculateEffectivePower(store, 'dave', 'Roads');
  console.log(`Dave's effective power on 'Roads': ${davePower} credits.\n`);

  // 3. Create Proposal
  console.log("[3] Creating Proposal: 'Solar Roadways'...");
  const proposal: Proposal = {
    id: 'prop-solar',
    title: 'Solar Roadways',
    abstract: 'Install solar panels on Main St.',
    detailedSpecs: 'High tech glass panels...',
    proposerId: 'alice',
    committeeId: 'comm-infra',
    status: 'DRAFT',
    milestones: [
      { id: 'm1', description: 'Design Phase', targetBudget: 500, isCompleted: false },
      { id: 'm2', description: 'Installation', targetBudget: 1500, isCompleted: false }
    ],
    totalTargetBudget: 2000,
    currentFunding: 0,
    votesFor: 0,
    votesAgainst: 0,
    executionPayload: '{}'
  };
  store.addProposal(proposal);

  const sponsored = transitionProposal(proposal, 'SPONSORED');
  store.updateProposal('prop-solar', sponsored);
  console.log("Proposal created and sponsored.\n");

  // 4. Voting (Quadratic Voting)
  console.log("[4] Voting Phase (Quadratic Voting)...");
  const active = transitionProposal(sponsored, 'ACTIVE_VOTING');
  store.updateProposal('prop-solar', active);

  // Dave uses his delegated power (300 credits) to cast votes
  // Cost = votes^2. sqrt(300) is approx 17.3. Let's cast 17 votes.
  const daveVotes = 17;
  const daveCost = calculateVoteCost(daveVotes);
  console.log(`Dave casts ${daveVotes} votes FOR (Cost: ${daveCost} credits)`);

  // Charlie is a whale, but QV limits his impact.
  // Charlie has 400 credits. He can cast 20 votes.
  const charlieVotes = -20; // Charlie hates solar roads
  const charlieCost = calculateVoteCost(charlieVotes);
  console.log(`Charlie casts ${Math.abs(charlieVotes)} votes AGAINST (Cost: ${charlieCost} credits)`);

  const totalVotes = aggregateVotes([daveVotes, charlieVotes]);
  console.log(`Total Net Votes: ${totalVotes} (${totalVotes > 0 ? 'Passed' : 'Failed'})\n`);

  // 5. Crowdfunding
  console.log("[5] Crowdfunding Phase...");
  console.log("Alice contributes 500.");
  crowdfunding.contribute('alice', 'prop-solar', 500);
  console.log("Bob contributes 1500.");
  crowdfunding.contribute('bob', 'prop-solar', 1500);

  console.log(`Current Funding: ${store.getProposal('prop-solar')?.currentFunding} / 2000`);
  const fundingSuccess = crowdfunding.finalizeFunding('prop-solar');
  console.log(`Funding Success: ${fundingSuccess}\n`);

  // 6. Execution (Milestones)
  console.log("[6] Execution Phase...");
  if (fundingSuccess) {
    console.log("Marking Design Phase as complete...");
    crowdfunding.releaseMilestoneFunds('prop-solar', 'm1');
    console.log(`Proposal Status: ${store.getProposal('prop-solar')?.status}`);

    console.log("Marking Installation as complete...");
    crowdfunding.releaseMilestoneFunds('prop-solar', 'm2');
    console.log(`Final Proposal Status: ${store.getProposal('prop-solar')?.status}`);
  }

  console.log("\n=== Simulation Complete ===");
}

runSimulation().catch(console.error);
