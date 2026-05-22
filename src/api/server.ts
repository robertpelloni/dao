import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { globalStore } from '../models/Store';
import { globalIdentity, IdentityManager } from '../core/identity';
import { calculateVoteCost } from '../core/qv';
import { delegate, calculateEffectivePower } from '../core/delegation';
import { transitionProposal } from '../core/proposalStateMachine';
import { CrowdfundingEngine } from '../core/crowdfunding';
import { calculateImpactScore } from '../core/impactScoring';
import { User, Proposal, Committee } from '../models/types';

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
 * Basic Authentication Middleware (PoC)
 * In a real system, this would use JWT or session-based auth.
 * For now, it ensures the 'x-user-id' header matches the userId in the request body.
 */
app.use((req, res, next) => {
  const skipPaths = ['/health', '/summary', '/proposals', '/committees', '/users'];
  if (skipPaths.includes(req.path) && req.method === 'GET') return next();

  const headerUserId = req.headers['x-user-id'];
  const bodyUserId = req.body?.userId;

  if (req.method === 'POST' && bodyUserId && headerUserId !== bodyUserId) {
    return res.status(401).json({ error: 'Unauthorized: User ID mismatch' });
  }
  next();
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
