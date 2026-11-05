import re

with open('src/api/routes/governance.ts', 'r') as f:
    content = f.read()

content = content.replace("import { globalStore } from '../../models/Store';", "import { globalStore } from '../../models/Store';\nimport { AutonomousProposalGenerator } from '../../core/proposalGenerator';")

generator_route = """
  router.post('/auto-generate-proposal', (req: Request, res: Response) => {
    try {
      const generator = new AutonomousProposalGenerator(globalStore);
      const proposal = generator.generateAutonomousProposal();
      if (proposal) {
         globalStore.addProposal(proposal);
         res.json({ message: 'Autonomous proposal generated successfully', proposal });
      } else {
         res.json({ message: 'No trends or data sufficient to generate proposal at this time.' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
"""

content = content.replace("return router;", f"{generator_route}\n  return router;")

with open('src/api/routes/governance.ts', 'w') as f:
    f.write(content)
