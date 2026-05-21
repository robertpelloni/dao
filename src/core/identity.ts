import { User } from '../models/types';
import { Store, globalStore } from '../models/Store';

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
      endorsedBy: []
    };
    this.profiles.set(userId, profile);
    return profile;
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
      this.profiles.set(userId, profile);
    }
  }
}

export const globalIdentity = new IdentityManager(globalStore);
