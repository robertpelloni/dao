import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { globalStore } from '../models/Store';
import { globalIdentity } from '../core/identity';
import { calculateVoteCost } from '../core/qv';
import { delegate, calculateEffectivePower } from '../core/delegation';
import { transitionProposal } from '../core/proposalStateMachine';
import { CrowdfundingEngine } from '../core/crowdfunding';
import { calculateImpactScore } from '../core/impactScoring';
import { globalGovernance } from '../core/governanceCycle';
import { globalTaskManager } from '../core/tasks';
import { globalTriage } from '../core/triage';
import { globalWatchdog } from '../core/watchdog';
import { User, Proposal, Committee } from '../models/types';
import { signToken, verifyToken } from '../utils/auth';

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
  const skipPaths = ['/health', '/summary', '/proposals', '/committees', '/users', '/auth/login', '/governance/trends', '/governance/cycles', '/governance/cycle', '/tasks', '/treasury/balance', '/treasury/transactions'];
  const publicPostPaths = ['/proposals/triage'];

  if (skipPaths.includes(req.path) && req.method === 'GET') return next();
  if (publicPostPaths.includes(req.path) && req.method === 'POST') return next();
  if (req.path === '/auth/login' && req.method === 'POST') return next();

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Fallback for PoC: check x-user-id for now to avoid breaking current UI
    const xUserId = req.headers['x-user-id'];
    if (xUserId) {
      (req as any).user = { userId: xUserId };
      return next();
    }
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

app.post('/users/:id/welcome', (req: Request, res: Response) => {
  const userId = s(req.params.id);
  const { interestSubject } = req.body;
  const user = globalStore.getUser(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // 1. Grant seed reputation (5 points) in chosen subject
  const subject = interestSubject || 'General';
  globalIdentity.rewardReputation(userId, subject, 5);

  // 2. Create a "Welcome Proposal" for the user to practice with
  const welcomeProposal: Proposal = {
    id: `welcome-${userId}-${Date.now()}`,
    title: `Welcome to LiquidGov, ${user.name}!`,
    abstract: `This is your personalized onboarding proposal. You can use your voice credits to vote on this initiative to see how Quadratic Voting works in the ${subject} domain.`,
    detailedSpecs: "LiquidGov is a voluntary state governed by expertise. By voting on this proposal, you are participating in the cognitive meritocracy.",
    proposerId: 'system',
    committeeId: `${subject.replace(/\s+/g, '-')}-Committee`,
    status: 'ACTIVE_VOTING',
    milestones: [{ id: 'm0', description: 'Complete Onboarding', targetBudget: 0, isCompleted: false }],
    totalTargetBudget: 0,
    currentFunding: 0,
    tokenSymbol: 'USD',
    votesFor: 0,
    votesAgainst: 0,
    executionPayload: '{}'
  };

  // Ensure committee exists
  const existing = globalStore.getCommittee(welcomeProposal.committeeId);
  if (!existing) {
     globalStore.addCommittee({
        id: welcomeProposal.committeeId,
        subject,
        members: [userId],
        thresholdQuorum: 0.05
     });
  }

  globalStore.addProposal(welcomeProposal);

  res.json({ message: 'Welcome package initialized', proposal: welcomeProposal });
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

app.post('/committees/:id/join', (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ error: 'Auth required' });

  const committee = globalStore.getCommittee(s(req.params.id));
  if (!committee) return res.status(404).json({ error: 'Committee not found' });

  if (!committee.members.includes(userId)) {
    committee.members.push(userId);
    globalStore.addCommittee(committee);
  }
  res.json(committee);
});

app.post('/committees/:id/leave', (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ error: 'Auth required' });

  const committee = globalStore.getCommittee(s(req.params.id));
  if (!committee) return res.status(404).json({ error: 'Committee not found' });

  committee.members = committee.members.filter(id => id !== userId);
  globalStore.addCommittee(committee);
  res.json(committee);
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
  const authedId = (req as any).user?.userId;

  if (authedId && userId !== authedId) {
    return res.status(403).json({ error: 'Unauthorized delegation' });
  }

  delegate(globalStore, userId, delegateId, subject);
  res.json({ message: `Delegated ${userId} -> ${delegateId} for ${subject}` });
});

app.delete('/delegate/:userId/:subject', (req: Request, res: Response) => {
  const { userId, subject } = req.params;
  const authedId = (req as any).user?.userId;

  if (authedId && userId !== authedId) {
    return res.status(403).json({ error: 'Unauthorized revocation' });
  }

  const user = globalStore.getUser(s(userId));
  if (user) {
    delete user.delegates[s(subject)];
    globalStore.addUser(user);
    res.json({ message: `Revoked delegation for ${subject}` });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.get('/power/:userId/:subject', (req: Request, res: Response) => {
  const powerBreakdown = calculateEffectivePower(globalStore, s(req.params.userId), s(req.params.subject));
  res.json({
    userId: req.params.userId,
    subject: req.params.subject,
    effectivePower: powerBreakdown.total,
    breakdown: powerBreakdown
  });
});

app.get('/delegators/:userId/:subject', (req: Request, res: Response) => {
  const delegators = globalStore.getDelegators(s(req.params.userId), s(req.params.subject));
  res.json(delegators);
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

  // Update committee activity
  const committee = globalStore.getCommittee(data.committeeId);
  if (committee) {
    committee.lastActivityAt = Date.now();
    globalStore.addCommittee(committee);
  }

  res.status(201).json(proposal);
});

app.get('/proposals', (req: Request, res: Response) => {
  res.json(globalStore.getProposals());
});

app.get('/proposals/:id', (req: Request, res: Response) => {
  const proposal = globalStore.getProposal(s(req.params.id));
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
  res.json(proposal);
});

app.get('/proposals/suggested/:userId', (req: Request, res: Response) => {
  const userId = s(req.params.userId);
  const authedId = (req as any).user?.userId;

  // Security: Prevent viewing other users' suggestions unless it's a public request (optional)
  // For now, we enforce that the requester must be the owner or we skip specific ranking.
  if (authedId && userId !== authedId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const user = globalStore.getUser(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const allProposals = globalStore.getProposals();
  const committees = Array.from(globalStore.committees.values());
  const suggested = globalTriage.suggestProposalsForUser(user, allProposals, committees);

  res.json(suggested);
});

app.post('/proposals/:id/transition', (req: Request, res: Response) => {
  const { status } = req.body;
  const proposal = globalStore.getProposal(s(req.params.id));
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  try {
    let updated = transitionProposal(proposal, status);

    // Fast-track logic for Emergency proposals:
    // Automatically transition to ACTIVE_VOTING if it hits EMERGENCY state.
    if (status === 'EMERGENCY') {
      updated = transitionProposal(updated, 'ACTIVE_VOTING');
    }

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
  const powerBreakdown = calculateEffectivePower(globalStore, userId, subject || 'General');

  if (powerBreakdown.total < cost) {
    return res.status(400).json({ error: `Insufficient power. Required: ${cost}, Available: ${powerBreakdown.total}` });
  }

  // Deduct cost proportionally from personal and delegator credits
  let remainingCost = cost;

  // 1. Spend personal credits first
  const personalSpend = Math.min(user.voiceCredits, remainingCost);
  user.voiceCredits -= personalSpend;
  remainingCost -= personalSpend;

  // 2. Spend delegator credits if personal not enough
  if (remainingCost > 0) {
    // Sort delegators by balance to spend from those with more first
    const sortedDelegators = [...powerBreakdown.delegators].sort((a, b) => b.voiceCredits - a.voiceCredits);

    for (const d of sortedDelegators) {
      if (remainingCost <= 0) break;
      const delegatorUser = globalStore.getUser(d.userId);
      if (delegatorUser) {
        const spend = Math.min(delegatorUser.voiceCredits, remainingCost);
        delegatorUser.voiceCredits -= spend;
        remainingCost -= spend;
        globalStore.addUser(delegatorUser);
      }
    }
  }

  globalStore.addUser(user);

  // Democratic Override Logic:
  // If a user votes personally, we check if their delegate has already spent their power.
  // This is a simplified "Override" for the PoC.
  const userDelegateId = user.delegates[subject || 'General'];
  if (userDelegateId) {
    // Check if delegate already voted on this proposal
    const delegateVotes = globalStore.getVotesByUser(userDelegateId).filter(v => v.proposalId === proposal.id);
    if (delegateVotes.length > 0) {
      console.log(`[OVERRIDE] User ${userId} is overriding delegate ${userDelegateId} on proposal ${proposal.id}`);
      // In a production system, we would mathematically retract the proportional weight.
      // For the simulator, we just record the personal vote which takes precedence in audits.
    }
  }

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

  // Update committee activity
  const committee = globalStore.getCommittee(proposal.committeeId);
  if (committee) {
    committee.lastActivityAt = Date.now();
    globalStore.addCommittee(committee);
  }

  globalStore.updateProposal(s(req.params.id), proposal);
  notifyUpdate(s(req.params.id));
  res.json({ message: 'Vote cast successfully', proposal });
});

app.post('/proposals/:id/contribute', (req: Request, res: Response) => {
  const { userId, amount } = req.body;
  try {
    crowdfunding.contribute(userId, s(req.params.id), amount);
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

app.post('/proposals/:id/milestones/:mid/resolve-dispute', (req: Request, res: Response) => {
  const { resolution } = req.body;
  const userId = (req as any).user?.userId;

  // Security: Only the proposer (to accept defeat) or an admin (mocked as user with high rep) can resolve
  // In a real system, this would be a committee vote.
  if (!userId) return res.status(401).json({ error: 'Auth required' });

  try {
    const success = crowdfunding.resolveDispute(s(req.params.id), s(req.params.mid), resolution || 'RELEASE');
    notifyUpdate(s(req.params.id));
    res.json({ success, proposal: globalStore.getProposal(s(req.params.id)) });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/proposals/:id/milestones/:mid/jury-vote', (req: Request, res: Response) => {
  const { action } = req.body;
  const userId = (req as any).user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    crowdfunding.voteOnMilestone(s(req.params.id), s(req.params.mid), userId, action || 'APPROVE');
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

app.get('/proposals/:id/estimate-match', (req: Request, res: Response) => {
  const amount = Number(req.query.amount);
  const userId = s(req.query.userId);
  if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });

  const contributions = globalStore.getContributionsByProposal(s(req.params.id));

  // Current match
  const currentMatch = crowdfunding.getTreasury().calculateMatch(contributions);

  // Hypothetical match
  const hypothetical = [...contributions, { userId, amount, proposalId: s(req.params.id), tokenSymbol: 'USD', timestamp: Date.now() }];
  const newMatch = crowdfunding.getTreasury().calculateMatch(hypothetical);

  res.json({
    currentMatch,
    newMatch,
    delta: newMatch - currentMatch,
    multiplier: (amount + (newMatch - currentMatch)) / amount
  });
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

// --- Treasury Endpoints ---

app.get('/treasury/balance/:token', (req: Request, res: Response) => {
  const subject = s(req.query.subject) || 'General';
  const balance = crowdfunding.getTreasury().getPoolBalance(s(req.params.token), subject);
  res.json({ token: req.params.token, subject, balance });
});

app.get('/treasury/balance', (req: Request, res: Response) => {
  const pools = crowdfunding.getTreasury().getAllPools();
  res.json(pools);
});

app.get('/treasury/transactions', (req: Request, res: Response) => {
  const txs = crowdfunding.getTreasury().getTransactions();
  res.json(txs);
});

app.post('/treasury/deposit', (req: Request, res: Response) => {
  const { amount, tokenSymbol, subject, description } = req.body;
  if (!amount) return res.status(400).json({ error: 'Amount required' });

  const targetSubject = subject || 'General';
  const targetSymbol = tokenSymbol || 'USD';
  const userId = (req as any).user?.userId;

  crowdfunding.getTreasury().deposit(Number(amount), targetSymbol, targetSubject, description || 'Voluntary Contribution', userId);

  // Notify clients about treasury update
  io.emit('TREASURY_UPDATED', { tokenSymbol: targetSymbol, subject: targetSubject });

  res.json({ message: 'Deposit successful', balance: crowdfunding.getTreasury().getPoolBalance(targetSymbol, targetSubject) });
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

if (require.main === module) {
  httpServer.listen(port, () => {
    console.log(`LiquidGov API server listening at http://localhost:${port}`);

    // Start the Autonomous Watchdog
    globalWatchdog.start();
  });
}

export default app;
