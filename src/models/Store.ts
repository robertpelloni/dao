import Database from 'better-sqlite3';
import { User, Committee, Proposal } from './types';

/**
 * SQLite Store for LiquidGov
 */
export class Store {
  private db: Database.Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        voiceCredits REAL,
        reputation TEXT,
        delegates TEXT
      );

      CREATE TABLE IF NOT EXISTS committees (
        id TEXT PRIMARY KEY,
        subject TEXT,
        members TEXT,
        thresholdQuorum REAL
      );

      CREATE TABLE IF NOT EXISTS proposals (
        id TEXT PRIMARY KEY,
        title TEXT,
        abstract TEXT,
        detailedSpecs TEXT,
        proposerId TEXT,
        committeeId TEXT,
        status TEXT,
        milestones TEXT,
        totalTargetBudget REAL,
        currentFunding REAL,
        votesFor REAL,
        votesAgainst REAL,
        executionPayload TEXT
      );
    `);
  }

  addUser(user: User) {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO users (id, name, voiceCredits, reputation, delegates) VALUES (?, ?, ?, ?, ?)');
    stmt.run(user.id, user.name, user.voiceCredits, JSON.stringify(user.reputation), JSON.stringify(user.delegates));
  }

  getUser(id: string): User | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      reputation: JSON.parse(row.reputation),
      delegates: JSON.parse(row.delegates)
    };
  }

  getUsers(): User[] {
    const stmt = this.db.prepare('SELECT * FROM users');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      ...row,
      reputation: JSON.parse(row.reputation),
      delegates: JSON.parse(row.delegates)
    }));
  }

  get users() {
    const self = this;
    return {
      values: () => self.getUsers()
    };
  }

  addCommittee(committee: Committee) {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO committees (id, subject, members, thresholdQuorum) VALUES (?, ?, ?, ?)');
    stmt.run(committee.id, committee.subject, JSON.stringify(committee.members), committee.thresholdQuorum);
  }

  getCommittee(id: string): Committee | undefined {
    const stmt = this.db.prepare('SELECT * FROM committees WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      members: JSON.parse(row.members)
    };
  }

  getCommittees(): Committee[] {
    const stmt = this.db.prepare('SELECT * FROM committees');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      ...row,
      members: JSON.parse(row.members)
    }));
  }

  get committees() {
    const self = this;
    return {
      values: () => self.getCommittees()
    };
  }

  addProposal(proposal: Proposal) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO proposals (
        id, title, abstract, detailedSpecs, proposerId, committeeId,
        status, milestones, totalTargetBudget, currentFunding,
        votesFor, votesAgainst, executionPayload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      proposal.id, proposal.title, proposal.abstract, proposal.detailedSpecs, proposal.proposerId, proposal.committeeId,
      proposal.status, JSON.stringify(proposal.milestones), proposal.totalTargetBudget, proposal.currentFunding,
      proposal.votesFor, proposal.votesAgainst, proposal.executionPayload
    );
  }

  getProposal(id: string): Proposal | undefined {
    const stmt = this.db.prepare('SELECT * FROM proposals WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      milestones: JSON.parse(row.milestones)
    };
  }

  getProposals(): Proposal[] {
    const stmt = this.db.prepare('SELECT * FROM proposals');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      ...row,
      milestones: JSON.parse(row.milestones)
    }));
  }

  get proposals() {
    const self = this;
    return {
      values: () => self.getProposals()
    };
  }

  updateProposal(id: string, updates: Partial<Proposal>) {
    const proposal = this.getProposal(id);
    if (proposal) {
      this.addProposal({ ...proposal, ...updates });
    }
  }

  clear() {
    this.db.exec('DELETE FROM users; DELETE FROM committees; DELETE FROM proposals;');
  }
}

export const globalStore = new Store('dao.db');
