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
  const skipPaths = ['/health', '/summary', '/proposals', '/committees', '/users', '/auth/login'];
  if (skipPaths.includes(req.path) && req.method === 'GET') return next();
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
    votesFor: 0,
    votesAgainst: 0,
    executionPayload: data.executionPayload || '{}'
  };
  globalStore.addProposal(proposal);
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

  if (power < cost) {
    return res.status(400).json({ error: `Insufficient power. Required: ${cost}, Available: ${power}` });
  }

  // Deduct cost from the user's personal credits.
  // Note: In Phase 2/3, we will refine how delegated power is "spent".
  user.voiceCredits -= cost;

  if (votes > 0) {
    proposal.votesFor += votes;
  } else {
    proposal.votesAgainst += Math.abs(votes);
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

app.post('/governance/transition-cycle', (req: Request, res: Response) => {
  try {
    const next = globalGovernance.transitionCycle();
    res.json({ message: 'Governance cycle transitioned successfully', next });
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
  });
}

export default app;
