import { TriageAgent } from '../src/core/triage';
import { Committee } from '../src/models/types';

describe('AI Proposal Triage Agent', () => {
  const triage = new TriageAgent();
  const committees: Committee[] = [
    { id: 'comm-1', subject: 'Infrastructure -> Roads', members: [], thresholdQuorum: 0.05 },
    { id: 'comm-2', subject: 'Education -> Schools', members: [], thresholdQuorum: 0.05 },
    { id: 'comm-3', subject: 'Healthcare -> Hospitals', members: [], thresholdQuorum: 0.05 }
  ];

  test('should suggest infrastructure for road-related proposals', () => {
    const suggested = triage.suggestCommittee('Fixing the Highway', 'The roads are full of potholes and need repair.', committees);
    expect(suggested?.id).toBe('comm-1');
  });

  test('should suggest education for school proposals', () => {
    const suggested = triage.suggestCommittee('New Textbooks', 'We need to buy new books for the primary school.', committees);
    expect(suggested?.id).toBe('comm-2');
  });

  test('should detect redundancy', () => {
    const existing = ['Fix the Bridge', 'Build a Park'];
    expect(triage.detectRedundancy('Fix the Bridge', existing)).toBe(true);
    expect(triage.detectRedundancy('Build a School', existing)).toBe(false);
  });
});
