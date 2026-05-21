import { Store } from '../models/Store';
/**
 * Identity Layer (Mock Sybil Resistance)
 *
 * Simulates a unique human verification system (Proof of Unique Human).
 * Uses a simple verification score based on "endorsements" from other verified users.
 */
export interface IdentityProfile {
    userId: string;
    isVerified: boolean;
    verificationScore: number;
    endorsedBy: string[];
}
export declare class IdentityManager {
    private store;
    private profiles;
    constructor(store: Store);
    /**
     * Initialize a profile for a new user.
     */
    createProfile(userId: string): IdentityProfile;
    /**
     * Endorse a user. If the endorser is verified, it increases the score significantly.
     */
    endorse(endorserId: string, subjectId: string): void;
    getProfile(userId: string): IdentityProfile | undefined;
    isVerified(userId: string): boolean;
    /**
     * Admin-level verification (e.g., WorldID, Passport integration mock)
     */
    verifyManually(userId: string): void;
}
export declare const globalIdentity: IdentityManager;
//# sourceMappingURL=identity.d.ts.map