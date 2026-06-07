import { execSync } from 'child_process';
import path from 'path';

/**
 * Component 2: Conflict-Aware Merge Engine
 *
 * Implements the Dual-Direction Intelligent Merge logic to reconcile feature branches.
 */
export class MergeEngine {
  constructor(private rootDir: string = path.join(__dirname, '../../../')) {}

  private run(command: string): string {
    try {
      return execSync(command, { cwd: this.rootDir, encoding: 'utf8' });
    } catch (err) {
      const error = err as { stderr?: string; message?: string };
      throw new Error(`Command failed: ${command}\n${error.stderr || error.message}`);
    }
  }

  /**
   * Identifies all active AI-generated and feature branches.
   */
  getFeatureBranches(): string[] {
    const output = this.run('git branch -r || echo ""');
    return output
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.includes('origin/jules-') || b.includes('origin/main-'))
      .map(b => b.replace('origin/', ''));
  }

  /**
   * Performs the dual-direction merge for a specific branch.
   */
  async reconcileBranch(branch: string): Promise<void> {
    console.log(`[APEP] Reconciling branch: ${branch}`);

    // Ensure main is ready
    this.run('git checkout main || git checkout -b main origin/main || true');

    // 1. Forward Merge (Feature -> Main)
    try {
      const isMerged = this.run(`git merge-base --is-ancestor origin/${branch} main || echo "no"`).trim() !== 'no';
      if (!isMerged) {
        console.log(`Merging ${branch} into main...`);
        this.run(`git merge origin/${branch} --no-edit --allow-unrelated-histories`);
      }
    } catch (err) {
      console.warn(`[!] Forward merge failed for ${branch}. Aborting merge.`);
      this.run('git merge --abort || true');
      return; // Skip reverse merge if forward failed
    }

    // 2. Reverse Merge (Main -> Feature)
    try {
      this.run(`git checkout ${branch} || git checkout -b ${branch} origin/${branch}`);
      this.run('git merge main --no-edit');
      // Pushing is handled in the deployment component, but we can do a local validation push if needed.
      this.run('git checkout main');
    } catch (err) {
      console.warn(`[!] Reverse merge failed for ${branch}. Aborting merge.`);
      this.run('git merge --abort || true');
      this.run('git checkout main');
    }
  }

  /**
   * Reconciles all identified feature branches.
   */
  async execute(): Promise<void> {
    const branches = this.getFeatureBranches();
    if (branches.length === 0) {
      console.log('[APEP] No feature branches found for reconciliation.');
      return;
    }

    for (const branch of branches) {
      // Validate branch name security
      if (!/^[a-zA-Z0-9.\/_-]+$/.test(branch)) {
        console.warn(`[!] Skipping potentially unsafe branch name: ${branch}`);
        continue;
      }
      await this.reconcileBranch(branch);
    }
  }
}
