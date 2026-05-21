import { User, Committee, Proposal } from './types';

/**
 * Simple in-memory store for the Proof of Concept.
 * In a real application, this would be replaced by a database or blockchain layer.
 */
export class Store {
  users: Map<string, User> = new Map();
  committees: Map<string, Committee> = new Map();
  proposals: Map<string, Proposal> = new Map();

  addUser(user: User) {
    this.users.set(user.id, user);
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  addCommittee(committee: Committee) {
    this.committees.set(committee.id, committee);
  }

  getCommittee(id: string): Committee | undefined {
    return this.committees.get(id);
  }

  addProposal(proposal: Proposal) {
    this.proposals.set(proposal.id, proposal);
  }

  getProposal(id: string): Proposal | undefined {
    return this.proposals.get(id);
  }

  updateProposal(id: string, updates: Partial<Proposal>) {
    const proposal = this.proposals.get(id);
    if (proposal) {
      this.proposals.set(id, { ...proposal, ...updates });
    }
  }
}

export const globalStore = new Store();
