import Database from 'better-sqlite3';
import { User, Committee, Proposal, GovernanceCycle } from './types';

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
        impactScore REAL,
        executionPayload TEXT
      );

      CREATE TABLE IF NOT EXISTS governance_cycles (
        id TEXT PRIMARY KEY,
        number INTEGER,
        startTime INTEGER,
        endTime INTEGER,
        status TEXT,
        totalVotesCast INTEGER,
        totalFundingAllocated REAL
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
    return {
      values: () => this.getUsers()
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
    return {
      values: () => this.getCommittees()
    };
  }

  addProposal(proposal: Proposal) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO proposals (
        id, title, abstract, detailedSpecs, proposerId, committeeId,
        status, milestones, totalTargetBudget, currentFunding,
        votesFor, votesAgainst, impactScore, executionPayload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      proposal.id, proposal.title, proposal.abstract, proposal.detailedSpecs, proposal.proposerId, proposal.committeeId,
      proposal.status, JSON.stringify(proposal.milestones), proposal.totalTargetBudget, proposal.currentFunding,
      proposal.votesFor, proposal.votesAgainst, proposal.impactScore || 0, proposal.executionPayload
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
    return {
      values: () => this.getProposals()
    };
  }

  updateProposal(id: string, updates: Partial<Proposal>) {
    const proposal = this.getProposal(id);
    if (proposal) {
      this.addProposal({ ...proposal, ...updates });
    }
  }

  /**
   * Identifies subjects with significant delegation activity that lack a committee.
   */
  getHighActivitySubjects(threshold: number = 2): string[] {
    const users = this.getUsers();
    const subjectCounts: Record<string, number> = {};

    users.forEach(u => {
      Object.keys(u.delegates).forEach(subject => {
        subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
      });
    });

    const committees = this.getCommittees();
    const existingSubjects = new Set(committees.map(c => c.subject));

    return Object.entries(subjectCounts)
      .filter(([subject, count]) => count >= threshold && !existingSubjects.has(subject))
      .map(([subject]) => subject);
  }

  addCycle(cycle: GovernanceCycle) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO governance_cycles (id, number, startTime, endTime, status, totalVotesCast, totalFundingAllocated)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(cycle.id, cycle.number, cycle.startTime, cycle.endTime, cycle.status, cycle.totalVotesCast || 0, cycle.totalFundingAllocated || 0);
  }

  getCurrentCycle(): GovernanceCycle | undefined {
    // Check for ACTIVE cycle first
    const active = this.db.prepare("SELECT * FROM governance_cycles WHERE status = 'ACTIVE' LIMIT 1").get();
    if (active) return active as GovernanceCycle;

    // If no active, get the most recent one (could be expired/offline)
    const latest = this.db.prepare("SELECT * FROM governance_cycles ORDER BY number DESC LIMIT 1").get();
    return latest as GovernanceCycle | undefined;
  }

  getCycles(): GovernanceCycle[] {
    const stmt = this.db.prepare('SELECT * FROM governance_cycles ORDER BY number DESC');
    return stmt.all() as GovernanceCycle[];
  }

  getHistoricalTrends() {
    const cycles = this.db.prepare("SELECT number, totalVotesCast, totalFundingAllocated FROM governance_cycles WHERE status = 'ARCHIVED' ORDER BY number ASC").all();
    return cycles;
  }

  clear() {
    this.db.exec('DELETE FROM users; DELETE FROM committees; DELETE FROM proposals; DELETE FROM governance_cycles;');
  }
}

export const globalStore = new Store('dao.db');
