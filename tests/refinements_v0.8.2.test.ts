import { Store } from '../src/models/Store';
import { globalIdentity } from '../src/core/identity';

describe('Phase 5 Refinements', () => {
  let store: Store;

  beforeEach(() => {
    store = new Store(':memory:');
  });

  describe('Committee Auto-Provisioning', () => {
    it('should identify high activity subjects', () => {
      store.addUser({ id: 'u1', name: 'User 1', voiceCredits: 100, reputation: {}, delegates: { 'Subject A': 'u2' } });
      store.addUser({ id: 'u3', name: 'User 3', voiceCredits: 100, reputation: {}, delegates: { 'Subject A': 'u2' } });

      const highActivity = store.getHighActivitySubjects(2);
      expect(highActivity).toContain('Subject A');
    });

    it('should not identify subjects below threshold', () => {
      store.addUser({ id: 'u1', name: 'User 1', voiceCredits: 100, reputation: {}, delegates: { 'Subject B': 'u2' } });

      const highActivity = store.getHighActivitySubjects(2);
      expect(highActivity).not.toContain('Subject B');
    });

    it('should not identify subjects that already have committees', () => {
      store.addCommittee({ id: 'c1', subject: 'Subject A', members: [], thresholdQuorum: 0.05 });
      store.addUser({ id: 'u1', name: 'User 1', voiceCredits: 100, reputation: {}, delegates: { 'Subject A': 'u2' } });
      store.addUser({ id: 'u3', name: 'User 3', voiceCredits: 100, reputation: {}, delegates: { 'Subject A': 'u2' } });

      const highActivity = store.getHighActivitySubjects(2);
      expect(highActivity).not.toContain('Subject A');
    });
  });

  describe('Proof of Humanity', () => {
    it('should initialize profile with isHuman: false', () => {
      const profile = globalIdentity.createProfile('u4');
      expect(profile.isHuman).toBe(false);
    });

    it('should verify human status', () => {
      globalIdentity.createProfile('u5');
      globalIdentity.verifyHuman('u5', 'Mock');
      const profile = globalIdentity.getProfile('u5');
      expect(profile?.isHuman).toBe(true);
      expect(profile?.pohMethod).toBe('Mock');
    });
  });
});
