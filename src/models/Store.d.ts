import { User, Committee, Proposal } from './types';
/**
 * SQLite Store for LiquidGov
 */
export declare class Store {
    private db;
    constructor(dbPath?: string);
    private init;
    addUser(user: User): void;
    getUser(id: string): User | undefined;
    getUsers(): User[];
    get users(): {
        values: () => User[];
    };
    addCommittee(committee: Committee): void;
    getCommittee(id: string): Committee | undefined;
    getCommittees(): Committee[];
    get committees(): {
        values: () => Committee[];
    };
    addProposal(proposal: Proposal): void;
    getProposal(id: string): Proposal | undefined;
    getProposals(): Proposal[];
    get proposals(): {
        values: () => Proposal[];
    };
    updateProposal(id: string, updates: Partial<Proposal>): void;
    clear(): void;
}
export declare const globalStore: Store;
//# sourceMappingURL=Store.d.ts.map