import { RepositoryManager } from '../src/core/repository';

const mgr = new RepositoryManager();

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const skipPush = args.includes('--skip-push') || isDryRun;

async function main() {
  console.log('=== LiquidGov EXECUTIVE PROTOCOL: TypeScript Engine Start ===');
  if (isDryRun) console.log('[DRY RUN] No changes will be pushed.');

  console.log('Step 0: Initialize');
  mgr.initialize();

  console.log('Step 1: Upstream Sync');
  mgr.syncUpstream();

  console.log('Step 2: Reconcile Branches');
  mgr.reconcileBranches();

  console.log('Step 3: Finalize Workspace');
  if (skipPush) {
      console.log('[SKIP] Push operations disabled. Finalizing local workspace only.');
  } else {
      mgr.finalizeWorkspace();
  }

  console.log('Step 4: Execute Build');
  mgr.executeBuild();

  console.log('Step 5: Generate Handoff');
  if (!skipPush) {
    mgr.generateHandoff();
  } else {
    console.log('[SKIP] Handoff generation skipped in dry-run/skip-push mode.');
  }

  console.log('Step 6: Verify Standards');
  mgr.verifyStandards();


  console.log('=== Protocol Engine Execution Complete ===');
}

main().catch(err => {
  console.error('Protocol engine failed:', err);
  process.exit(1);
});
