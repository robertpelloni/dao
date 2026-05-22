import { User, Committee, Proposal } from '../models/types';
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
export function resolveDelegate(
  store: Store,
  userId: string,
  subject: string
): string {
  let currentId = userId;
  const visited = new Set<string>();

  while (true) {
    if (visited.has(currentId)) {
      // Cycle detected.
      return userId;
    }

    visited.add(currentId);
    const user = store.getUser(currentId);
    if (!user) return currentId;

    const delegateId = user.delegates[subject];
    if (!delegateId) {
      return currentId;
    }

    currentId = delegateId;
  }
}

/**
 * Calculates the total voting power (voice credits) concentrated in a user for a subject.
 * This includes the user's own credits plus all credits delegated to them.
 *
 * @param store The data store
 * @param targetUserId The user whose power we are calculating
 * @param subject The subject node
 * @returns Total voice credits
 */
export function calculateEffectivePower(
  store: Store,
  targetUserId: string,
  subject: string
): number {
  let totalCredits = 0;

  // Iterate through all users to see who delegates to targetUserId
  const allUsers = store.getUsers();
  for (const user of allUsers) {
    if (resolveDelegate(store, user.id, subject) === targetUserId) {
      totalCredits += user.voiceCredits;
    }
  }

  return totalCredits;
}

/**
 * Sets a delegation for a user.
 *
 * @param store The data store
 * @param userId The user who is delegating
 * @param delegateId The user who will receive the power
 * @param subject The subject node
 */
export function delegate(
  store: Store,
  userId: string,
  delegateId: string,
  subject: string
): void {
  const user = store.getUser(userId);
  if (user) {
    user.delegates[subject] = delegateId;
    store.addUser(user); // Persist update
  }
}

/**
 * Revokes a delegation for a user.
 *
 * @param store The data store
 * @param userId The user who is revoking
 * @param subject The subject node
 */
export function revokeDelegation(
  store: Store,
  userId: string,
  subject: string
): void {
  const user = store.getUser(userId);
  if (user) {
    delete user.delegates[subject];
    store.addUser(user); // Persist update
  }
}
