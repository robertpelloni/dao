import { calculateVoteCost, calculateVotesFromCredits, aggregateVotes } from '../src/core/qv';

describe('Quadratic Voting Logic', () => {
  test('calculateVoteCost should follow n^2 formula', () => {
    expect(calculateVoteCost(0)).toBe(0);
    expect(calculateVoteCost(1)).toBe(1);
    expect(calculateVoteCost(2)).toBe(4);
    expect(calculateVoteCost(3)).toBe(9);
    expect(calculateVoteCost(10)).toBe(100);
    expect(calculateVoteCost(-2)).toBe(4); // Negative votes (against) still cost credits
  });

  test('calculateVotesFromCredits should follow sqrt(n) formula', () => {
    expect(calculateVotesFromCredits(0)).toBe(0);
    expect(calculateVotesFromCredits(1)).toBe(1);
    expect(calculateVotesFromCredits(4)).toBe(2);
    expect(calculateVotesFromCredits(9)).toBe(3);
    expect(calculateVotesFromCredits(100)).toBe(10);
    expect(calculateVotesFromCredits(-1)).toBe(0);
  });

  test('aggregateVotes should sum up all votes', () => {
    expect(aggregateVotes([1, 2, 3])).toBe(6);
    expect(aggregateVotes([1, -1, 5])).toBe(5);
    expect(aggregateVotes([])).toBe(0);
  });
});
