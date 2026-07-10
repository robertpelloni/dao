import { Router, Request, Response } from 'express';
import { TreasuryManager } from '../../core/treasury';

export function createTreasuryRouter(treasuryManager: TreasuryManager): Router {
  const router = Router();

  /**
   * GET /api/treasury/pools
   * Get all matching pools
   */
  router.get('/pools', (req: Request, res: Response) => {
    try {
      const pools = treasuryManager.getAllPools();
      res.json(pools);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/treasury/balances
   * Get total treasury balances
   */
  router.get('/balances', (req: Request, res: Response) => {
    try {
      const balances = treasuryManager.getAllTreasuryBalances();
      res.json(balances);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/treasury/intake
   * Intake funds into the treasury
   */
  router.post('/intake', (req: Request, res: Response) => {
    try {
      const { amount, tokenSymbol } = req.body;
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }

      const token = tokenSymbol || 'USD';
      treasuryManager.intakeFunds(amount, token);

      res.json({
        message: 'Funds received successfully',
        balance: treasuryManager.getTreasuryBalance(token)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/treasury/allocate
   * Allocate funds from the treasury to a matching pool
   */
  router.post('/allocate', (req: Request, res: Response) => {
    try {
      const { amount, tokenSymbol } = req.body;
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }

      const token = tokenSymbol || 'USD';
      const success = treasuryManager.allocateToMatchingPool(amount, token);

      if (!success) {
        return res.status(400).json({ error: 'Insufficient funds in the treasury' });
      }

      res.json({
        message: 'Funds allocated to matching pool successfully',
        poolBalance: treasuryManager.getPoolBalance(token),
        remainingTreasuryBalance: treasuryManager.getTreasuryBalance(token)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
