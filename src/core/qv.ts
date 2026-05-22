/**
 * Quadratic Voting (QV) Core Logic
 *
 * In Quadratic Voting, the cost to cast 'n' votes is proportional to n^2.
 * This measures the intensity of preference, preventing a simple majority
 * from easily steamrolling a passionate minority.
 */

/**
 * Calculates the cost in Voice Credits for a given number of votes.
 * Formula: cost = votes^2
 *
 * @param votes The number of votes to cast (can be positive or negative)
 * @returns The cost in voice credits
 */
export function calculateVoteCost(votes: number): number {
  return Math.pow(votes, 2);
}

/**
 * Calculates how many votes can be "bought" with a certain number of credits.
 * Formula: votes = sqrt(credits)
 *
 * @param credits The number of voice credits to spend
 * @returns The number of votes (real number, may need floor/round depending on system rules)
 */
export function calculateVotesFromCredits(credits: number): number {
  if (credits < 0) return 0;
  return Math.sqrt(credits);
}

/**
 * Aggregates votes for a proposal across multiple participants.
 * In QV, the total support is often the sum of the square roots of individual credit allocations,
 * OR simply the sum of individual 'votes' cast (where each vote was paid for quadratically).
 *
 * We will use the latter for clarity: participants cast 'v' votes, costing 'v^2'.
 * Total proposal strength = sum(v_i)
 *
 * @param voteCounts Array of votes cast by different users
 * @returns Total vote count
 */
export function aggregateVotes(voteCounts: number[]): number {
  return voteCounts.reduce((acc, v) => acc + v, 0);
}
