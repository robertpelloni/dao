
import request from 'supertest';
import app from '../src/api/server';
import { globalStore } from '../src/models/Store';
import { globalIdentity } from '../src/core/identity';

describe('Phase 10: API E2E Integration Suite', () => {
  let aliceToken: string;
  let charlieToken: string;

  beforeAll(async () => {
    // We need users to exist to login
    globalStore.addUser({ id: 'alice', name: 'Alice', voiceCredits: 100, reputation: {}, delegates: {} });
    globalStore.addUser({ id: 'charlie', name: 'Charlie', voiceCredits: 100, reputation: {}, delegates: {} });

    // 1. Authenticate and get JWTs
    const aliceRes = await request(app).post('/auth/login').send({ userId: 'alice' });
    aliceToken = aliceRes.body.token;

    const charlieRes = await request(app).post('/auth/login').send({ userId: 'charlie' });
    charlieToken = charlieRes.body.token;

    // Admin verify charlie for jury duty
    await request(app).post('/identity/charlie/verify-human')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ method: 'External' });
  });

  afterAll(() => {
    globalStore.clear();
  });

  it('should process the full lifecycle via HTTP API', async () => {
    const proposalId = `e2e-${Date.now()}`;

    // 1. Create Proposal
    const propRes = await request(app).post('/proposals')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        id: proposalId,
        title: 'Docker E2E Proposal',
        abstract: 'Testing via HTTP',
        proposerId: 'alice',
        committeeId: 'General',
        totalTargetBudget: 5000,
        tokenSymbol: 'USD',
        milestones: [
          { description: 'Design', targetBudget: 1000 },
          { description: 'Build', targetBudget: 4000 }
        ]
      });

    expect(propRes.status).toBe(201);

    // 2. Transition to Active Voting
    await request(app).post(`/proposals/${proposalId}/transition`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ status: 'ACTIVE_VOTING' });

    // 3. Multi-token Contribution
    await request(app).post(`/proposals/${proposalId}/contribute`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        userId: 'alice',
        amount: 1,
        tokenSymbol: 'ETH' // 3000 USD
      });

    await request(app).post(`/proposals/${proposalId}/contribute`)
      .set('Authorization', `Bearer ${charlieToken}`)
      .send({
        userId: 'charlie',
        amount: 2000,
        tokenSymbol: 'USDC' // 2000 USD
      });

    // 4. Deposit to Treasury
    await request(app).post('/treasury/deposit')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        amount: 5000,
        tokenSymbol: 'USD'
      });

    // 5. Finalize Funding
    const finalizeRes = await request(app).post(`/proposals/${proposalId}/finalize-funding`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({});


    expect(finalizeRes.body).toBeDefined();
    expect(finalizeRes.body.success).toBe(true);
    expect(finalizeRes.body.proposal.status).toBe('FUNDED');
    expect(finalizeRes.body.proposal.currentFunding).toBeGreaterThanOrEqual(5000);

    // 6. Identity Analytics check
    const analyticsRes = await request(app).get('/api/governance/identity-analytics')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(analyticsRes.body.totalIdentities).toBeGreaterThan(0);
    expect(analyticsRes.body.details).toBeDefined();
  });
});
