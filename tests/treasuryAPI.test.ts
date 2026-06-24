import express from 'express';
import request from 'supertest';
import { createTreasuryRouter } from '../src/api/routes/treasury';
import { TreasuryManager } from '../src/core/treasury';
import { Store } from '../src/models/Store';

describe('Treasury API', () => {
  let app: express.Application;
  let treasuryManager: TreasuryManager;
  let store: Store;

  beforeEach(() => {
    store = new Store();
    treasuryManager = new TreasuryManager(store);
    app = express();
    app.use(express.json());
    app.use('/api/treasury', createTreasuryRouter(treasuryManager));
  });

  test('POST /api/treasury/intake adds funds to treasury', async () => {
    const res = await request(app)
      .post('/api/treasury/intake')
      .send({ amount: 5000, tokenSymbol: 'DAI' });

    expect(res.status).toBe(200);
    expect(res.body.balance).toBe(5000);
    expect(treasuryManager.getTreasuryBalance('DAI')).toBe(5000);
  });

  test('POST /api/treasury/allocate moves funds to pool', async () => {
    treasuryManager.intakeFunds(2000, 'USDC');

    const res = await request(app)
      .post('/api/treasury/allocate')
      .send({ amount: 1000, tokenSymbol: 'USDC' });

    expect(res.status).toBe(200);
    expect(res.body.poolBalance).toBe(1000);
    expect(res.body.remainingTreasuryBalance).toBe(1000);

    const failRes = await request(app)
      .post('/api/treasury/allocate')
      .send({ amount: 2000, tokenSymbol: 'USDC' });

    expect(failRes.status).toBe(400);
    expect(failRes.body.error).toBe('Insufficient funds in the treasury');
  });

  test('GET /api/treasury/pools returns all pools', async () => {
    treasuryManager.setMatchingPool(100, 'USD');
    treasuryManager.setMatchingPool(50, 'ETH');

    const res = await request(app).get('/api/treasury/pools');
    expect(res.status).toBe(200);
    expect(res.body['USD']).toBe(100);
    expect(res.body['ETH']).toBe(50);
  });
});
