import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { globalStore } from '../models/Store';
import { SecurityEngine } from '../core/security';
import { globalIdentity } from '../core/identity';
import { calculateVoteCost } from '../core/qv';
import { delegate, revokeDelegation, calculateEffectivePower } from '../core/delegation';
import { transitionProposal } from '../core/proposalStateMachine';
import { CrowdfundingEngine } from '../core/crowdfunding';
import { calculateImpactScore } from '../core/impactScoring';
import { globalGovernance } from '../core/governanceCycle';
import { globalTaskManager } from '../core/tasks';
import { globalTriage } from '../core/triage';
import { User, Proposal, Committee } from '../models/types';
import { signToken, verifyToken } from '../utils/auth';
import { createTreasuryRouter } from './routes/treasury';

/**
 * LiquidGov REST API Server
 */

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const port = process.env.PORT || 3000;
const crowdfunding = new CrowdfundingEngine(globalStore);

app.use(cors());
app.use(express.json());

/**
 * JWT Authentication Middleware
 */
const authenticateToken = (req: Request, res: Response, next: any) => {
  const skipPaths = ['/health', '/summary', '/proposals', '/committees', '/users', '/auth/login', '/governance/trends', '/governance/cycles', '/governance/cycle', '/tasks'];
  const publicPostPaths = ['/proposals/triage', '/proposals'];

  if (skipPaths.includes(req.path) && req.method === 'GET') return next();
  if (publicPostPaths.includes(req.path) && req.method === 'POST') return next();
  if (req.path === '/auth/login' && req.method === 'POST') return next();

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const payload = verifyToken(token);
    (req as any).user = payload;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

app.use(authenticateToken);

/**
 * Authentication Endpoints
 */
app.post('/auth/login', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const user = globalStore.getUser(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const token = signToken({ userId });
  res.json({ token, user });
});

// --- WebSocket Setup ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const notifyUpdate = (proposalId: string) => {
  io.emit('PROPOSAL_UPDATED', { proposalId });
};

// Helper to ensure param is string
const s = (val: any): string => (val || '').toString();

// --- User Endpoints ---

app.post('/users', (req: Request, res: Response) => {
  const { id, name, voiceCredits } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'ID and Name required' });

  const user: User = {
    id,
    name,
    voiceCredits: voiceCredits || 100,
    reputation: {},
    delegates: {}
  };
  globalStore.addUser(user);
  res.status(201).json(user);
});

app.get('/users/:id', (req: Request, res: Response) => {
  const user = globalStore.getUser(s(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.get('/identity/:id', (req: Request, res: Response) => {
  const profile = globalIdentity.getProfile(s(req.params.id));
  if (!profile) {
    // If not found, create one (lazy init for PoC)
    const newProfile = globalIdentity.createProfile(s(req.params.id));
    return res.json(newProfile);
  }
  res.json(profile);
});

app.get('/identity/:id/breakdown', (req: Request, res: Response) => {
  const breakdown = globalIdentity.getPowerBreakdown(s(req.params.id));
  res.json(breakdown);
});

app.post('/identity/:id/verify-human', (req: Request, res: Response) => {
  const { method } = req.body;
  try {
    globalIdentity.verifyHuman(s(req.params.id), method || 'Mock');
    res.json(globalIdentity.getProfile(s(req.params.id)));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/identity/:id/verify-zkp', async (req: Request, res: Response) => {
  const { proof } = req.body;
  try {
    const success = await globalIdentity.verifyZKP(s(req.params.id), proof);
    if (success) {
      res.json(globalIdentity.getProfile(s(req.params.id)));
    } else {
      res.status(400).json({ error: 'Invalid ZKP proof' });
    }
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/users/:id/endorse', (req: Request, res: Response) => {
  const { endorserId } = req.body;
  try {
    globalIdentity.endorse(endorserId, s(req.params.id));
    res.json(globalIdentity.getProfile(s(req.params.id)));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/users', (req: Request, res: Response) => {
  res.json(Array.from(globalStore.users.values()));
});

// --- Committee Endpoints ---

app.post('/committees', (req: Request, res: Response) => {
  const { id, subject, members, thresholdQuorum } = req.body;
  const committee: Committee = { id, subject, members: members || [], thresholdQuorum: thresholdQuorum || 0.05 };
  globalStore.addCommittee(committee);
  res.status(201).json(committee);
});

app.get('/committees', (req: Request, res: Response) => {
  res.json(Array.from(globalStore.committees.values()));
});

app.post('/committees/auto-provision', (req: Request, res: Response) => {
  const activityThreshold = req.body.threshold || 2;
  const newSubjects = globalStore.getHighActivitySubjects(activityThreshold);


  const created: Committee[] = [];
  newSubjects.forEach(subject => {
    const committee: Committee = {
      id: `${subject.replace(/\s+/g, '-')}-Committee`,
      subject,
      members: [], // Initially empty, citizens can join
      thresholdQuorum: 0.05
    };
    globalStore.addCommittee(committee);
    created.push(committee);
  });

  res.json({
    message: `Auto-provisioning complete. Created ${created.length} new committees.`,
    created
  });
});

app.get('/committees/suggested/:userId', (req: Request, res: Response) => {
  const userId = s(req.params.userId);
  const user = globalStore.getUser(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Suggest committees based on the user's active delegations or reputation subjects
  const userSubjects = new Set(Object.keys(user.delegates));
  Object.keys(user.reputation).forEach(s => userSubjects.add(s));

  const allCommittees = Array.from(globalStore.committees.values());
  const suggested = allCommittees.filter(c => userSubjects.has(c.subject));

  // If no specific subjects, suggest the most popular committees (mock: just return all if few)
  if (suggested.length === 0) {
    res.json(allCommittees.slice(0, 5));
  } else {
    res.json(suggested);
  }
});

// --- Delegation Endpoints ---

app.post('/delegate', (req: Request, res: Response) => {
  const { userId, delegateId, subject } = req.body;
  delegate(globalStore, userId, delegateId, subject);
  res.json({ message: `Delegated ${userId} -> ${delegateId} for ${subject}` });
});

app.get('/power/:userId/:subject', (req: Request, res: Response) => {
  const power = calculateEffectivePower(globalStore, s(req.params.userId), s(req.params.subject));
  res.json({ userId: req.params.userId, subject: req.params.subject, effectivePower: power });
});

// Who delegates to this user on a subject (IdentityView delegation panel).
app.get('/delegators/:userId/:subject', (req: Request, res: Response) => {
  const power = calculateEffectivePower(globalStore, s(req.params.userId), s(req.params.subject));
  res.json(power.delegators);
});

// Revoke a delegation (IdentityView). Core logic: core/delegation.revokeDelegation.
app.delete('/delegate/:userId/:subject', (req: Request, res: Response) => {
  revokeDelegation(globalStore, s(req.params.userId), s(req.params.subject));
  res.json({ message: `Delegation revoked for ${req.params.userId} on ${req.params.subject}` });
});

// Join a committee (IdentityView). Idempotent; bumps lastActivityAt so the
// committee-sunset check in governanceCycle sees real activity.
app.post('/committees/:id/join', (req: Request, res: Response) => {
  const committee = globalStore.getCommittee(s(req.params.id));
  if (!committee) return res.status(404).json({ error: 'Committee not found' });
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  if (!committee.members.includes(userId)) committee.members.push(userId);
  committee.lastActivityAt = Date.now();
  globalStore.addCommittee(committee);
  res.json(committee);
});

// PoC onboarding (useDashboard welcome flow): a brand-new user with no reputation
// gets a small starter reputation in their interest subject so suggestion feeds
// have something to rank. No-op (still 200) once they have any reputation.
app.post('/users/:id/welcome', (req: Request, res: Response) => {
  const user = globalStore.getUser(s(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  const subject = (req.body && req.body.interestSubject) || 'General';
  if (Object.keys(user.reputation).length === 0) {
    user.reputation[subject] = 5;
    globalStore.addUser(user);
  }
  res.json(user);
});

// --- Proposal Endpoints ---

app.post('/proposals', (req: Request, res: Response) => {
  const data = req.body;
  const proposal: Proposal = {
    id: data.id,
    title: data.title,
    abstract: data.abstract,
    detailedSpecs: data.detailedSpecs,
    proposerId: data.proposerId,
    committeeId: data.committeeId,
    status: 'DRAFT',
    milestones: data.milestones || [],
    totalTargetBudget: data.totalTargetBudget,
    currentFunding: 0,
    tokenSymbol: data.tokenSymbol || 'USD',
    votesFor: 0,
    votesAgainst: 0,
    executionPayload: data.executionPayload || '{}'
  };
  globalStore.addProposal(proposal);
  res.status(201).json(proposal);
});

// Dashboard suggestion feed (useDashboard). Registered before /proposals/:id or
// Express would capture "suggested" as a proposal id. Uses the triage agent's
// reputation-ranked ACTIVE_VOTING suggestions.
app.get('/proposals/suggested/:userId', (req: Request, res: Response) => {
  const user = globalStore.getUser(s(req.params.userId));
  if (!user) return res.status(404).json({ error: 'User not found' });
  const suggested = globalTriage.suggestProposalsForUser(user, globalStore.getProposals(), Array.from(globalStore.committees.values()));
  res.json(suggested);
});

app.get('/proposals', (req: Request, res: Response) => {
  res.json(globalStore.getProposals());
});

app.get('/proposals/:id', (req: Request, res: Response) => {
  const proposal = globalStore.getProposal(s(req.params.id));
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
  res.json(proposal);
});

app.post('/proposals/:id/transition', (req: Request, res: Response) => {
  const { status } = req.body;
  const proposal = globalStore.getProposal(s(req.params.id));
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  try {
    const updated = transitionProposal(proposal, status);
    globalStore.updateProposal(s(req.params.id), updated);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/proposals/:id/vote', (req: Request, res: Response) => {
  const { userId, votes, subject } = req.body;
  const proposal = globalStore.getProposal(s(req.params.id));
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  if (!globalIdentity.isVerified(userId)) {
    return res.status(403).json({ error: 'User must be verified to vote' });
  }

  const user = globalStore.getUser(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const cost = calculateVoteCost(votes);
  const power = calculateEffectivePower(globalStore, userId, subject || 'General');

  // calculateEffectivePower returns a breakdown object; compare its total (CHANGELOG 1.1.4).
  if (power.total < cost) {
    return res.status(400).json({ error: `Insufficient power. Required: ${cost}, Available: ${power.total}` });
  }

  // Deduct cost from the user's personal credits.
  // Note: In Phase 2/3, we will refine how delegated power is "spent".
  user.voiceCredits -= cost;

  if (votes > 0) {
    proposal.votesFor += votes;
  } else {
    proposal.votesAgainst += Math.abs(votes);
  }

  // Persist vote record for security analysis
  globalStore.addVote({
    userId,
    proposalId: s(req.params.id),
    amount: votes,
    subject: subject || 'General',
    timestamp: Date.now()
  });

  globalStore.updateProposal(s(req.params.id), proposal);
  notifyUpdate(s(req.params.id));
  res.json({ message: 'Vote cast successfully', proposal });
});


// Treasury API
app.post('/treasury/deposit', (req: Request, res: Response) => {
  const { amount, tokenSymbol, userId, subject } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  const token = tokenSymbol || 'USD';

  const txId = Math.random().toString(36).substring(7);
  globalStore.addTreasuryTransaction({
    id: txId,
    tokenSymbol: token,
    amount,
    type: 'DEPOSIT',
    // Attribution lets /treasury/transactions?userId= (IdentityView) work.
    ...(userId ? { userId } : {}),
    ...(subject ? { subject } : {}),
    timestamp: Date.now()
  });

  // With a subject, the deposit funds that subject-specific pool (Voluntary Tax
  // Routing, 1.1.109); without one it funds the token pool as before.
  const treasury = crowdfunding.getTreasury();
  const currentPool = treasury.getPoolBalance(token, subject);
  treasury.setMatchingPool(currentPool + amount, token, subject);

  res.json({ message: 'Deposit successful', txId, newBalance: treasury.getPoolBalance(token, subject) });
});

app.get('/treasury/balances', (req: Request, res: Response) => {
  const balances = globalStore.getTreasuryBalances();
  res.json(balances);
});

// Dashboard shape (useDashboard/HealthDashboard): matching-pool balances as a
// list of {tokenSymbol, amount}. Distinct from /balances (stored treasury totals).
app.get('/treasury/balance', (req: Request, res: Response) => {
  const pools = crowdfunding.getTreasury().getAllPools();
  res.json(Object.entries(pools).map(([tokenSymbol, amount]) => ({ tokenSymbol, amount })));
});

// Treasury ledger (IdentityView lifetime contributions). ?userId= filters to
// transactions attributed to that user; unattributed system deposits are
// returned only when no userId is given.
app.get('/treasury/transactions', (req: Request, res: Response) => {
  const txs = crowdfunding.getTreasury().getTransactions();
  const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
  res.json(userId ? txs.filter((t: any) => t.userId === userId) : txs);
});

// Modular treasury router (routes/treasury.ts): pools/intake/allocate. Mounted on
// the SAME TreasuryManager instance the inline routes use — mounting it with a
// fresh instance (the old archived patch did this in reverse) would split state.
// The governance router (routes/archive/governance.ts) was NOT mounted: every
// route it defined duplicates an inline route above except sybil-report, which
// the UI already covers via /security/flagged.
app.use('/treasury', createTreasuryRouter(crowdfunding.getTreasury()));

const storedBalances = globalStore.getTreasuryBalances();
Object.keys(storedBalances).forEach(token => {
  crowdfunding.getTreasury().setMatchingPool(storedBalances[token] || 0, token);
});

app.post('/proposals/:id/contribute', (req: Request, res: Response) => {
  const { userId, amount, tokenSymbol } = req.body;
  try {
    crowdfunding.contribute(userId, s(req.params.id), amount, tokenSymbol);
    notifyUpdate(s(req.params.id));
    res.json({ message: 'Contribution successful', proposal: globalStore.getProposal(s(req.params.id)) });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/proposals/:id/finalize-funding', (req: Request, res: Response) => {
  const success = crowdfunding.finalizeFunding(s(req.params.id));
  res.json({ success, proposal: globalStore.getProposal(s(req.params.id)) });
});

app.post('/proposals/:id/release-milestone', (req: Request, res: Response) => {
  const { milestoneId } = req.body;
  const success = crowdfunding.releaseMilestoneFunds(s(req.params.id), milestoneId);
  res.json({ success, proposal: globalStore.getProposal(s(req.params.id)) });
});

app.post('/proposals/:id/milestones/:mid/jury-vote', (req: Request, res: Response) => {
  const { userId } = req.body;
  try {
    crowdfunding.voteOnMilestone(s(req.params.id), s(req.params.mid), userId);
    notifyUpdate(s(req.params.id));
    res.json({ success: true, proposal: globalStore.getProposal(s(req.params.id)) });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/proposals/:id/score', (req: Request, res: Response) => {
  const proposal = globalStore.getProposal(s(req.params.id));
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  const score = calculateImpactScore(proposal);
  globalStore.updateProposal(s(req.params.id), { impactScore: score });
  res.json({ id: proposal.id, impactScore: score });
});

app.post('/proposals/triage', (req: Request, res: Response) => {
  const { title, abstract } = req.body;
  if (!title || !abstract) return res.status(400).json({ error: 'Title and abstract required' });

  const committees = Array.from(globalStore.committees.values());
  const suggested = globalTriage.suggestCommittee(title, abstract, committees);

  const existingProposals = globalStore.getProposals();
  const existingTitles = existingProposals.map(p => p.title);
  const isRedundant = globalTriage.detectRedundancy(title, existingTitles);

  res.json({
    suggestedCommittee: suggested,
    isRedundant,
    message: isRedundant ? 'Warning: A similar proposal might already exist.' : 'No obvious redundancies detected.'
  });
});

// --- Security & Audit Endpoints ---


app.post('/api/governance/auto-generate-proposal', (req: Request, res: Response) => {
  const { topic, proposerId } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic required' });

  const pid = proposerId || 'system-agent';
  const newId = `auto-${Date.now()}`;

  const proposal: Proposal = {
    id: newId,
    title: `Autonomous Proposal: ${topic}`,
    abstract: `Automatically generated proposal based on trend analysis for ${topic}.`,
    detailedSpecs: 'TBD by committee. This proposal has been auto-generated by the governance oracle.',
    proposerId: pid,
    committeeId: 'General',
    status: 'DRAFT',
    milestones: [
       { id: 'm1', description: 'Initial Review', targetBudget: 1000, isCompleted: false },
       { id: 'm2', description: 'Implementation', targetBudget: 4000, isCompleted: false }
    ],
    totalTargetBudget: 5000,
    currentFunding: 0,
    tokenSymbol: 'USD',
    votesFor: 0,
    votesAgainst: 0,
    executionPayload: '{}'
  };

  // 1. Calculate Sybil Threat Level
  const securityEngine = new SecurityEngine(globalStore);
  const metrics = securityEngine.analyzeGraphResistance();
  // Arbitrary threat scoring: 1 point per suspicious cluster
  const sybilThreatLevel = metrics.suspiciousComponents.length;

  // 2. Calculate Proposer Reputation
  let rep = 0;
  if (pid !== 'system-agent') {
      const u = globalStore.getUser(pid);
      if (u) {
          rep = Object.values(u.reputation).reduce((a, b) => a + b, 0);
      }
  } else {
      rep = 100; // System agent is highly trusted
  }

  // 3. Mock an initial engagement velocity for a newly synthesized trend
  const simulatedVelocity = 40; // Moderate high starting engagement

  // 4. Oracle Impact Assessment (Self-Certification)
  // We import synthesizeOracleAssessment from impactScoring at the top (if needed, else we can compute inline)
  // To avoid import errors, let's just do it directly or use calculateImpactScore
  const baseImpact = calculateImpactScore(proposal);
  const sybilPenalty = sybilThreatLevel > 0 ? (sybilThreatLevel * 10) : 0;
  const engagementBonus = Math.min(simulatedVelocity / 2, 30);
  const repBonus = rep > 50 ? 10 : 0;

  const finalScore = Math.max(0, Math.min(100, baseImpact - sybilPenalty + engagementBonus + repBonus));

  proposal.impactScore = finalScore;

  if (finalScore >= 80) {
      proposal.status = 'ACTIVE_VOTING'; // Self-certifies past DRAFT directly
  }

  globalStore.addProposal(proposal);
  notifyUpdate(proposal.id);

  res.status(201).json({
      message: 'Autonomous proposal generated and pre-validated.',
      oracleMetrics: {
         baseImpact,
         sybilThreatLevel,
         engagementVelocity: simulatedVelocity,
         proposerReputation: rep,
         finalImpactScore: finalScore
      },
      proposal
  });
});

app.get('/api/governance/security-metrics', (req: Request, res: Response) => {
  const securityEngine = new SecurityEngine(globalStore);

  const flaggedClusters = securityEngine.detectSybilClusters();

  // Analyze delegation depth across all subjects
  const subjects = new Set<string>();
  globalStore.getUsers().forEach(u => {
    Object.keys(u.delegates).forEach(s => subjects.add(s));
  });

  const depthMetrics: Record<string, any> = {};
  subjects.forEach(subject => {
    depthMetrics[subject] = securityEngine.evaluateDelegationDepth(subject);
  });

  const graphResistance = securityEngine.analyzeGraphResistance();

  res.json({
    sybilClusters: flaggedClusters,
    delegationDepth: depthMetrics,
    graphResistance
  });
});


// --- Identity Analytics Endpoints ---
app.get('/api/governance/identity-analytics', (req: Request, res: Response) => {
  const users = globalStore.getUsers();

  const analytics = users.map(u => {
    const profile = globalIdentity.getProfile(u.id);
    const powerBreakdown = globalIdentity.getPowerBreakdown(u.id);

    return {
      userId: u.id,
      isVerified: profile?.isVerified || false,
      pohMethod: profile?.pohMethod || 'None',
      flaggedAsSybil: profile?.flaggedAsSybil || false,
      powerBreakdown,
      voiceCredits: u.voiceCredits
    };
  });

  res.json({
    totalIdentities: users.length,
    verifiedHumans: analytics.filter(a => a.isVerified).length,
    flaggedSybils: analytics.filter(a => a.flaggedAsSybil).length,
    details: analytics
  });
});

app.get('/security/flagged', (req: Request, res: Response) => {
  const users = globalStore.getUsers();
  const flagged = users.filter(u => {
    const profile = globalIdentity.getProfile(u.id);
    return profile?.flaggedAsSybil === true;
  });
  res.json(flagged);
});

// --- Governance Cycle Endpoints ---

app.get('/governance/cycle', (req: Request, res: Response) => {
  let cycle = globalStore.getCurrentCycle();
  if (!cycle) {
    cycle = globalGovernance.initialize();
  }
  res.json(cycle);
});

app.get('/governance/cycles', (req: Request, res: Response) => {
  res.json(globalStore.getCycles());
});

app.get('/governance/trends', (req: Request, res: Response) => {
  res.json(globalStore.getHistoricalTrends());
});

app.post('/governance/transition-cycle', (req: Request, res: Response) => {
  try {
    const next = globalGovernance.transitionCycle();
    res.json({ message: 'Governance cycle transitioned successfully', next });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Task Endpoints ---

app.get('/tasks', (req: Request, res: Response) => {
  res.json(globalTaskManager.getTasks());
});

app.post('/tasks', (req: Request, res: Response) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const task = globalTaskManager.createTask(title, description || '');
  res.status(201).json(task);
});

app.post('/tasks/:id/execute', async (req: Request, res: Response) => {
  try {
    // Run execution in the background
    globalTaskManager.executeTask(s(req.params.id));
    res.json({ message: 'Task execution started in background' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Health Check ---
app.get('/summary', (req: Request, res: Response) => {
  const users = globalStore.getUsers();
  const proposals = globalStore.getProposals();
  const committees = globalStore.getCommittees();

  res.json({
    userCount: users.length,
    proposalCount: proposals.length,
    committeeCount: committees.length,
    totalFunding: proposals.reduce((acc, p) => acc + (p.currentFunding || 0), 0)
  });
});

// --- Health Check ---
app.get('/health', (req: Request, res: Response) => {
  let version = 'unknown';
  try {
    version = fs.readFileSync(path.join(__dirname, '../../VERSION.md'), 'utf8').trim();
  } catch (err) {
    console.error('Failed to read version file', err);
  }
  res.json({ status: 'OK', version });
});

// First-run demo seed: the dashboard hardcodes user 'alice' (useDashboard) and
// the store starts empty, so a fresh server 404'd every dashboard call. Seed
// demo citizens + a General committee only when the store is completely empty;
// disable with LIQUIDGOV_NO_SEED=true. Never runs on import (tests seed their own).
function seedDemoData(): void {
  if (process.env.LIQUIDGOV_NO_SEED === 'true') return;
  if (globalStore.getUsers().length > 0) return;
  const demoUsers: User[] = [
    { id: 'alice', name: 'Alice', voiceCredits: 100, reputation: { General: 25, Roads: 20 }, delegates: {} },
    { id: 'bob', name: 'Bob', voiceCredits: 100, reputation: { General: 5 }, delegates: { Roads: 'alice' } },
    { id: 'charlie', name: 'Charlie', voiceCredits: 100, reputation: { General: 15 }, delegates: {} },
    { id: 'dave', name: 'Dave', voiceCredits: 100, reputation: {}, delegates: {} }
  ];
  demoUsers.forEach(u => globalStore.addUser(u));
  globalStore.addCommittee({ id: 'General-Committee', subject: 'General', members: ['alice', 'charlie'], thresholdQuorum: 0.05, lastActivityAt: Date.now() });
  console.log('[Seed] Demo data created (alice/bob/charlie/dave, General-Committee). Set LIQUIDGOV_NO_SEED=true to skip.');
}

if (require.main === module) {
  seedDemoData();
  httpServer.listen(port, () => {
    console.log(`LiquidGov API server listening at http://localhost:${port}`);

    // No Autonomous Watchdog: it was archived to archive/protocol-bot/
    // (2026-11-19). Starting this server must never mutate git.
  });
}

export default app;
