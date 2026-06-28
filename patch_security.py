import re

with open('src/api/routes/governance.ts', 'r') as f:
    content = f.read()

security_metrics = """
  /**
   * GET /api/governance/security-metrics
   * Returns advanced security and platform health metrics.
   */
  router.get('/security-metrics', (req: Request, res: Response) => {
    try {
      const users = globalStore.getUsers();
      const verifiedUsers = users.filter(u => globalStore.getIdentity(u.id)?.isVerified);
      const flaggedUsers = users.filter(u => globalStore.getIdentity(u.id)?.flaggedAsSybil);

      const proposals = globalStore.getProposals();
      const activeProposals = proposals.filter(p => ['DRAFT', 'FUNDED', 'IN_PROGRESS'].includes(p.status));
      const completedProposals = proposals.filter(p => p.status === 'COMPLETED');
      const rejectedProposals = proposals.filter(p => p.status === 'REJECTED');

      const clusters = sybilDetector.detectClusters();
      const uniqueClusters = new Set(Object.values(clusters)).size;

      const securityScore = Math.max(0, 100 - (flaggedUsers.length * 5) - (uniqueClusters * 2));

      res.json({
         totalCitizens: users.length,
         verifiedCitizens: verifiedUsers.length,
         flaggedSybils: flaggedUsers.length,
         sybilClustersDetected: uniqueClusters,
         platformSecurityScore: securityScore,
         proposalStats: {
             total: proposals.length,
             active: activeProposals.length,
             completed: completedProposals.length,
             rejected: rejectedProposals.length
         }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
"""

content = content.replace("  return router;", f"{security_metrics}\n  return router;")
content = content.replace("import { globalStore } from '../../models/Store';", "import { globalStore } from '../../models/Store';\nimport { globalIdentity } from '../../core/identity';")
content = content.replace("globalStore.getIdentity(u.id)?.isVerified", "globalIdentity.isVerified(u.id)")
content = content.replace("globalStore.getIdentity(u.id)?.flaggedAsSybil", "globalIdentity.getProfile(u.id)?.flaggedAsSybil")

with open('src/api/routes/governance.ts', 'w') as f:
    f.write(content)
