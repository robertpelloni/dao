import { Router, Request, Response } from 'express';
import { globalGovernance } from '../../core/governanceCycle';
import { SybilDetector } from '../../core/sybil';
import { globalStore } from '../../models/Store';

export function createGovernanceRouter(): Router {
  const router = Router();
  const sybilDetector = new SybilDetector(globalStore);

  router.post('/transition-cycle', (req: Request, res: Response) => {
    try {
      globalGovernance.transitionCycle();
      res.json({ message: 'Governance cycle transitioned successfully', currentCycle: globalStore.getCurrentCycle() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/cycles', (req: Request, res: Response) => {
    res.json(globalStore.getCycles());
  });

  router.get('/cycle', (req: Request, res: Response) => {
    let cycle = globalStore.getCurrentCycle();
    if (!cycle) { cycle = globalGovernance.initialize(); }
    res.json(cycle);
  });

  router.get('/trends', (req: Request, res: Response) => {
    res.json(globalStore.getHistoricalTrends());
  });

  /**
   * GET /api/governance/sybil-report
   * Returns cluster analysis and detected Sybil rings.
   */
  router.get('/sybil-report', (req: Request, res: Response) => {
    try {
      const clusters = sybilDetector.detectClusters();

      // Analyze penalties
      const report: Record<string, any> = {};
      Object.entries(clusters).forEach(([userId, clusterId]) => {
        if (!report[clusterId]) {
          report[clusterId] = {
            members: [],
            penalty: sybilDetector.calculateSybilPenalty(clusterId, clusters)
          };
        }
        report[clusterId].members.push(userId);
      });

      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
