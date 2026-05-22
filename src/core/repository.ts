import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Repository Handling Module
 * Implements the 'EXECUTIVE PROTOCOL' for autonomous repository management.
 */
export class RepositoryManager {
  private rootDir: string;

  constructor(rootDir: string = path.join(__dirname, '../../')) {
    this.rootDir = rootDir;
  }

  private run(command: string, cwd: string = this.rootDir): string {
    try {
      return execSync(command, { cwd, encoding: 'utf8' });
    } catch (err: any) {
      console.error(`Command failed: ${command}`);
      console.error(err.stderr || err.message);
      throw err;
    }
  }

  /**
   * Step 1: Upstream Tracking & Submodule Sanitization
   */
  syncUpstream(): void {
    console.log('[1/4] Fetching all remotes and updating submodules recursively...');
    this.run('git fetch --all --tags');
    // Ensure submodules are updated to their latest tracked commits recursively
    this.run('git submodule update --init --recursive --remote');
  }

  /**
   * Step 2: Dual-Direction Intelligent Merge Engine
   */
  reconcileBranches(): void {
    console.log('[2/4] Executing Dual-Direction Intelligent Merge Engine...');

    // Configure git identity for the session
    this.run('git config user.email "autopilot@liquidgov.org"');
    this.run('git config user.name "LiquidGov Autopilot"');
    this.run('git config init.defaultBranch main');

    const branchesOutput = this.run('git branch -r || echo ""');
    const branches = branchesOutput
      ? branchesOutput.split('\n').map(b => b.trim()).filter(b => b.includes('origin/jules-') || b.includes('origin/main-'))
      : [];

    if (branches.length === 0) {
      console.log('No feature branches found for reconciliation.');
      return;
    }

    for (const branch of branches) {
      const cleanBranch = branch.replace('origin/', '');
      console.log(`Interrogating branch: ${cleanBranch}`);

      // Ensure local main exists
      this.run('git checkout main || git checkout -b main origin/main || true');

      // Forward Merge (Features to Main)
      try {
        const isMerged = this.run(`git merge-base --is-ancestor ${branch} main || echo "no"`).trim() !== 'no';
        if (!isMerged) {
          console.log(`Merging ${cleanBranch} into main...`);
          this.run(`git merge ${branch} --no-edit --allow-unrelated-histories`);
        } else {
          console.log(`Branch ${cleanBranch} is already merged into main.`);
        }
      } catch (err) {
        console.warn(`Forward merge failed for ${cleanBranch}. Skipping.`);
        this.run('git merge --abort || true');
      }

      // Reverse Merge (Main back to Features)
      try {
        console.log(`Reverse merging main into ${cleanBranch}...`);
        this.run(`git checkout ${cleanBranch} || git checkout -b ${cleanBranch} ${branch}`);
        this.run('git merge main --no-edit');
        this.run(`git push origin ${cleanBranch} || echo "Push skipped"`);
        this.run('git checkout main');
      } catch (err) {
        console.warn(`Reverse merge failed for ${cleanBranch}. Skipping.`);
        this.run('git merge --abort || true');
        this.run('git checkout main');
      }
    }
  }

  /**
   * Step 3: Workspace Cleanup & Documentation Sync
   */
  finalizeWorkspace(): void {
    console.log('[3/4] Finalizing workspace and documentation...');

    const versionFile = path.join(this.rootDir, 'VERSION.md');
    const packageFile = path.join(this.rootDir, 'package.json');
    const changelogFile = path.join(this.rootDir, 'CHANGELOG.md');

    if (!fs.existsSync(versionFile)) return;

    const currentVersion = fs.readFileSync(versionFile, 'utf8').trim();
    const parts = currentVersion.split('.').map(Number);
    parts[2]++;
    const newVersion = parts.join('.');

    console.log(`Bumping version: ${currentVersion} -> ${newVersion}`);
    fs.writeFileSync(versionFile, newVersion);

    const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
    pkg.version = newVersion;
    fs.writeFileSync(packageFile, JSON.stringify(pkg, null, 2));

    const date = new Date().toISOString().split('T')[0];
    let changelog = fs.readFileSync(changelogFile, 'utf8');
    const entry = `\n## [${newVersion}] - ${date}\n### Added\n- Automated protocol sync and branch reconciliation.\n`;
    changelog = changelog.replace('## [Unreleased]', `## [Unreleased]\n${entry}`);
    fs.writeFileSync(changelogFile, changelog);

    // Commit and push
    this.run('git add VERSION.md package.json CHANGELOG.md ROADMAP.md TODO.md HANDOFF.md');
    this.run(`git commit -m "Bump version to ${newVersion}: Automated Protocol Sync [skip ci]" || echo "Nothing to commit"`);

    // Ensure all remote feature branches are updated with the new version commit
    const branchesOutput = this.run('git branch -r || echo ""');
    const branches = branchesOutput
      ? branchesOutput.split('\n').map(b => b.trim()).filter(b => b.includes('origin/jules-') || b.includes('origin/main-'))
      : [];

    for (const branch of branches) {
      const cleanBranch = branch.replace('origin/', '');
      try {
        this.run(`git checkout ${cleanBranch}`);
        this.run('git merge main --no-edit');
        this.run(`git push origin ${cleanBranch} || echo "Push skipped"`);
      } catch (err) {
        console.warn(`Final reverse merge failed for ${cleanBranch}.`);
        this.run('git merge --abort || true');
      }
    }

    this.run('git checkout main');
    this.run('git push origin main || echo "Push failed"');
  }

  verifyStandards(): void {
    console.log('[4/4] Verifying documentation standards...');
    const mandatory = ['VISION.md', 'MEMORY.md', 'DEPLOY.md', 'CHANGELOG.md', 'ROADMAP.md', 'TODO.md', 'VERSION.md', 'IDEAS.md', 'HANDOFF.md', 'AGENTS.md'];
    for (const file of mandatory) {
      if (!fs.existsSync(path.join(this.rootDir, file))) {
        throw new Error(`Mandatory file missing: ${file}`);
      }
      console.log(`✓ ${file} exists`);
    }
  }
}
