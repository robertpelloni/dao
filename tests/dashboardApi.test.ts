import request from 'supertest';
import app from '../src/api/server';
import { globalStore } from '../src/models/Store';

// The dashboard (useDashboard + IdentityView + HealthDashboard) calls these
// endpoints; they were missing, and the single Promise.all in useDashboard
// meant one 404 emptied the whole dashboard. Pin the contract here.
describe('Dashboard API endpoints', () => {
  let token: string;

  beforeAll(async () => {
    globalStore.addUser({ id: 'alice', name: 'Alice', voiceCredits: 100, reputation: { Roads: 20 }, delegates: {} });
    globalStore.addUser({ id: 'bob', name: 'Bob', voiceCredits: 100, reputation: {}, delegates: { Roads: 'alice' } });
    globalStore.addCommittee({ id: 'Roads-Committee', subject: 'Roads', members: [], thresholdQuorum: 0.05 });
    globalStore.addProposal({
      id: 'p1', title: 'Fix roads', abstract: 'a', detailedSpecs: 's', proposerId: 'alice',
      committeeId: 'Roads-Committee', status: 'ACTIVE_VOTING', milestones: [],
      totalTargetBudget: 1000, currentFunding: 0, tokenSymbol: 'USD', votesFor: 0, votesAgainst: 0, executionPayload: '{}'
    });
    const login = await request(app).post('/auth/login').send({ userId: 'alice' });
    token = login.body.token;
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  test('GET /proposals/suggested/:userId returns reputation-ranked proposals', async () => {
    const res = await request(app).get('/proposals/suggested/alice').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.map((p: any) => p.id)).toContain('p1');
  });

  test('GET /treasury/balance returns [{tokenSymbol, amount}] pool list', async () => {
    const res = await request(app).get('/treasury/balance').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((b: any) => b.tokenSymbol === 'USD' && typeof b.amount === 'number')).toBe(true);
  });

  test('GET /treasury/transactions?userId= returns attributed deposits', async () => {
    const dep = await request(app).post('/treasury/deposit').set(auth()).send({ amount: 50, tokenSymbol: 'USD', userId: 'alice' });
    expect(dep.status).toBe(200);
    const res = await request(app).get('/treasury/transactions?userId=alice').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.some((t: any) => t.type === 'DEPOSIT' && t.amount === 50)).toBe(true);
    const other = await request(app).get('/treasury/transactions?userId=nobody').set(auth());
    expect(other.body).toEqual([]);
  });

  test('mounted treasury router shares state with inline treasury routes', async () => {
    const intake = await request(app).post('/treasury/intake').set(auth()).send({ amount: 700, tokenSymbol: 'USD' });
    expect(intake.status).toBe(200);
    const allocate = await request(app).post('/treasury/allocate').set(auth()).send({ amount: 200, tokenSymbol: 'USD' });
    expect(allocate.status).toBe(200);
    // The inline /treasury/balance list must see the router-allocated pool:
    // same TreasuryManager instance, no split-brain state.
    const balance = await request(app).get('/treasury/balance').set(auth());
    expect(balance.body.some((b: any) => b.tokenSymbol === 'USD' && b.amount >= 200)).toBe(true);
  });

  test('delegators, revoke, committee join, and welcome flows', async () => {
    const delegators = await request(app).get('/delegators/alice/Roads').set(auth());
    expect(delegators.status).toBe(200);
    expect(delegators.body.map((d: any) => d.userId)).toContain('bob');

    const joined = await request(app).post('/committees/Roads-Committee/join').set(auth()).send({ userId: 'alice' });
    expect(joined.status).toBe(200);
    expect(joined.body.members).toContain('alice');

    const revoked = await request(app).delete('/delegate/bob/Roads').set(auth());
    expect(revoked.status).toBe(200);
    const after = await request(app).get('/delegators/alice/Roads').set(auth());
    expect(after.body.map((d: any) => d.userId)).not.toContain('bob');

    globalStore.addUser({ id: 'newbie', name: 'New', voiceCredits: 100, reputation: {}, delegates: {} });
    const welcome = await request(app).post('/users/newbie/welcome').set(auth()).send({ interestSubject: 'General' });
    expect(welcome.status).toBe(200);
    expect(welcome.body.reputation.General).toBe(5);
  });
});
