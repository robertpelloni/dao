import { RepositoryManager } from '../src/core/repository';

const mgr = new RepositoryManager();

async function main() {
  console.log('=== LiquidGov EXECUTIVE PROTOCOL: TypeScript Engine Start ===');

  mgr.syncUpstream();
  mgr.reconcileBranches();
  mgr.finalizeWorkspace();
  mgr.verifyStandards();

  console.log('=== Protocol Engine Execution Complete ===');
}

main().catch(err => {
  console.error('Protocol engine failed:', err);
  process.exit(1);
});
