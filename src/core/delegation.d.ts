import { Store } from '../models/Store';
/**
 * Liquid Delegation Logic
 *
 * Users can delegate their voting power for specific subjects to other users.
 * Delegation can be transitive (A -> B -> C), meaning C votes with A and B's power.
 * Delegation can be revoked instantly.
 */
/**
 * Resolves the ultimate delegate for a user on a specific subject.
 * Handles transitive delegation and detects circularity.
 *
 * @param store The data store
 * @param userId The user starting the delegation chain
 * @param subject The subject node (e.g., "Infrastructure -> Roads")
 * @returns The final user ID in the delegation chain.
 */
export declare function resolveDelegate(store: Store, userId: string, subject: string): string;
/**
 * Calculates the total voting power (voice credits) concentrated in a user for a subject.
 * This includes the user's own credits plus all credits delegated to them.
 *
 * @param store The data store
 * @param targetUserId The user whose power we are calculating
 * @param subject The subject node
 * @returns Total voice credits
 */
export declare function calculateEffectivePower(store: Store, targetUserId: string, subject: string): number;
/**
 * Sets a delegation for a user.
 *
 * @param store The data store
 * @param userId The user who is delegating
 * @param delegateId The user who will receive the power
 * @param subject The subject node
 */
export declare function delegate(store: Store, userId: string, delegateId: string, subject: string): void;
/**
 * Revokes a delegation for a user.
 *
 * @param store The data store
 * @param userId The user who is revoking
 * @param subject The subject node
 */
export declare function revokeDelegation(store: Store, userId: string, subject: string): void;
//# sourceMappingURL=delegation.d.ts.map