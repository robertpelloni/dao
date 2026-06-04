import { Store, globalStore } from '../models/Store';
import { calculateEffectivePower } from './delegation';
import { globalZKP } from './zkp';

/**
 * Identity Layer (Mock Sybil Resistance)
 *
 * Simulates a unique human verification system (Proof of Unique Human).
 * Uses a simple verification score based on "endorsements" from other verified users.
 */

export interface IdentityProfile {
  userId: string;
  isVerified: boolean;
  verificationScore: number; // 0 to 100
  endorsedBy: string[]; // List of user IDs
  isHuman: boolean; // Sybil resistance status
  pohMethod?: 'Mock' | 'Endorsement' | 'External' | 'ZKP';
}

export class IdentityManager {
  private profiles: Map<string, IdentityProfile> = new Map();

  constructor(private store: Store) {}

  /**
   * Initialize a profile for a new user.
   */
  createProfile(userId: string): IdentityProfile {
    const profile: IdentityProfile = {
      userId,
      isVerified: false,
      verificationScore: 0,
      endorsedBy: [],
      isHuman: false
    };
    this.profiles.set(userId, profile);
    return profile;
  }

  /**
   * Calculates the voting power breakdown across all subjects for a given user.
   * This helps identify where a user's liquid power comes from.
   */
  getPowerBreakdown(userId: string): Record<string, number> {
    const user = this.store.getUser(userId);
    if (!user) return {};

    // In a real system, we would query the subjects table.
    // For now, we aggregate across the subjects currently present in all users' delegations
    // and committees.
    const subjects = new Set<string>(['General']);
    this.store.getUsers().forEach(u => {
      Object.keys(u.delegates).forEach(s => subjects.add(s));
    });
    this.store.getCommittees().forEach(c => subjects.add(c.subject));

    const breakdown: Record<string, number> = {};
    subjects.forEach(subject => {
      const power = calculateEffectivePower(this.store, userId, subject);
      if (power > 0) {
        breakdown[subject] = power;
      }
    });

    return breakdown;
  }

  /**
   * Endorse a user. If the endorser is verified, it increases the score significantly.
   */
  endorse(endorserId: string, subjectId: string): void {
    const endorserProfile = this.profiles.get(endorserId);
    const subjectProfile = this.profiles.get(subjectId);

    if (!endorserProfile || !subjectProfile) throw new Error('Profile not found');
    if (endorserId === subjectId) throw new Error('Cannot endorse self');
    if (subjectProfile.endorsedBy.includes(endorserId)) return; // Already endorsed

    subjectProfile.endorsedBy.push(endorserId);

    // Simple logic: Each endorsement from a verified user adds 25 points.
    // Unverified endorsement adds 5 points.
    if (endorserProfile.isVerified) {
      subjectProfile.verificationScore += 25;
    } else {
      subjectProfile.verificationScore += 5;
    }

    // Auto-verify at 50 points
    if (subjectProfile.verificationScore >= 50) {
      subjectProfile.isVerified = true;
    }

    this.profiles.set(subjectId, subjectProfile);
  }

  getProfile(userId: string): IdentityProfile | undefined {
    return this.profiles.get(userId);
  }

  isVerified(userId: string): boolean {
    return this.profiles.get(userId)?.isVerified || false;
  }

  /**
   * Admin-level verification (e.g., WorldID, Passport integration mock)
   */
  verifyManually(userId: string): void {
    const profile = this.profiles.get(userId);
    if (profile) {
      profile.isVerified = true;
      profile.verificationScore = 100;
      profile.isHuman = true;
      profile.pohMethod = 'External';
      this.profiles.set(userId, profile);
    }
  }

  verifyHuman(userId: string, method: 'Mock' | 'Endorsement' | 'External' | 'ZKP' = 'Mock'): void {
    const profile = this.profiles.get(userId);
    if (profile) {
      profile.isHuman = true;
      profile.pohMethod = method;
      this.profiles.set(userId, profile);
    }
  }

  async verifyZKP(userId: string, proof: any): Promise<boolean> {
    const profile = this.profiles.get(userId);
    if (!profile) return false;

    const isValid = await globalZKP.verify(proof);
    if (isValid) {
      profile.isHuman = true;
      profile.pohMethod = 'ZKP';
      this.profiles.set(userId, profile);
    }
    return isValid;
  }
}

export const globalIdentity = new IdentityManager(globalStore);
