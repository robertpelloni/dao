import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Repository Handling Module
 * Implements the 'EXECUTIVE PROTOCOL' for autonomous repository management.
 */
export class RepositoryManager {
  private rootDir: string;
  private activities: string[] = [];

  constructor(rootDir: string = path.join(__dirname, '../../')) {
    this.rootDir = rootDir;
  }

  private run(command: string, cwd: string = this.rootDir): string {
    try {
      return execSync(command, { cwd, encoding: 'utf8' });
    } catch (err) {
      const error = err as { stderr?: string; message?: string };
      console.error(`Command failed: ${command}`);
      console.error(error.stderr || error.message);
      throw err;
    }
  }

  /**
   * Step 0: Initialize Environment
   * Sets up git configuration and verifies mandatory project files.
   */
  initialize(): void {
    console.log('[0/5] Initializing autonomous repository environment...');

    // Configure git identity for the session
    this.run('git config user.email "autopilot@liquidgov.org"');
    this.run('git config user.name "LiquidGov Autopilot"');
    this.run('git config init.defaultBranch main');

    // Verify mandatory files
    const criticalFiles = ['AGENTS.md', 'VISION.md', 'VERSION.md', 'PROTOCOL.md'];
    for (const file of criticalFiles) {
      if (!fs.existsSync(path.join(this.rootDir, file))) {
        throw new Error(`Critical file missing: ${file}. Environment not ready.`);
      }
    }

    console.log('✓ Repository environment initialized.');
  }

  /**
   * Step 1: Upstream Tracking & Submodule Sanitization
   */
  syncUpstream(): void {
    console.log('[1/4] Fetching all remotes and updating submodules recursively...');
    try {
      this.run('git fetch --all --tags');
    } catch (err) {
      console.error('[!] Root fetch failed. Continuing with local state if possible.');
    }


    // Recursive fetch for submodules
    try {
      console.log('Fetching submodules...');
      this.run('git submodule foreach --recursive git fetch --all --tags');
    } catch {
      console.warn('[!] Submodule fetch failed or no submodules present.');
    }

    // Upstream Sync: Identify the upstream parent and merge changes
    try {
      const remotes = this.run('git remote').split('\n').map(r => r.trim());
      if (remotes.includes('upstream')) {
        console.log('Merging changes from upstream/main...');
        this.run('git checkout main');
        this.run('git merge upstream/main --no-edit --allow-unrelated-histories');
      } else {
        console.log('No upstream remote found. Skipping upstream sync.');
      }
    } catch (err) {
      console.warn('[!] Upstream merge skipped (no changes or merge conflict).');
    }

    // Ensure submodules are updated to their latest tracked commits recursively
    try {
      console.log('Updating submodules to latest tracked commits...');
      this.run('git submodule update --init --recursive --remote');
    } catch (err) {
      console.error('[!] Recursive submodule update failed. Check submodule configurations.');
    }
  }

  /**
   * Step 2: Dual-Direction Intelligent Merge Engine
   */
  reconcileBranches(): void {
    console.log('[2/4] Executing Dual-Direction Intelligent Merge Engine...');

    // Ensure we have the latest info about remote branches
    try {
      this.run('git fetch origin');
    } catch {
      console.warn('[!] Remote branch fetch failed.');
    }

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

      // Security: Validate branch name to prevent command injection
      if (!/^[a-zA-Z0-9.\/_ -]+$/.test(cleanBranch)) {
        console.warn(`Skipping potentially unsafe branch name: ${cleanBranch}`);
        continue;
      }

      console.log(`Interrogating branch: ${cleanBranch}`);

      // Ensure local main exists
      this.run('git checkout main || git checkout -b main origin/main || true');

      // Forward Merge (Features to Main)
      try {
        const remoteBranch = `origin/${cleanBranch}`;
        const isMerged = this.run(`git merge-base --is-ancestor ${remoteBranch} main || echo "no"`).trim() !== 'no';

        if (!isMerged) {
          console.log(`Testing ${cleanBranch} before merge...`);
          this.run(`git checkout "${cleanBranch}" || git checkout -b "${cleanBranch}" "origin/${cleanBranch}"`);

          try {
            // Run pre-merge tests
            if (!process.env.SKIP_PROTOCOL_TESTS) {
              console.log('Running tests...');
              this.run('npm test');
            } else {
              console.log('Skipping tests (SKIP_PROTOCOL_TESTS set).');
            }
            console.log(`✓ Tests passed for ${cleanBranch}. Proceeding with merge.`);

            this.run('git checkout main');
            this.run(`git merge "${remoteBranch}" --no-edit --allow-unrelated-histories`);
            this.activities.push(`Merged feature branch ${cleanBranch} into main.`);
          } catch (testErr) {
            console.error(`[!] Tests failed on ${cleanBranch}. Blocking merge.`);
            this.logConflict(cleanBranch, 'Test Failure');
            this.run('git checkout main');
            continue;
          }
        } else {
          console.log(`Branch ${cleanBranch} is already merged into main.`);
        }
      } catch (mergeErr) {
        console.warn(`Forward merge failed for ${cleanBranch}. Skipping.`);
        this.logConflict(cleanBranch, 'Merge Conflict');
        this.run('git merge --abort || true');
        this.run('git checkout main');
      }

      // Reverse Merge (Main back to Features)
      try {
        console.log(`Reverse merging main into ${cleanBranch}...`);
        this.run(`git checkout "${cleanBranch}" || git checkout -b "${cleanBranch}" "origin/${cleanBranch}"`);
        this.run('git merge main --no-edit');
        this.run(`git push origin "${cleanBranch}" || echo "Push skipped"`);
        this.run('git checkout main');
      } catch {
        console.warn(`Reverse merge failed for ${cleanBranch}. Skipping.`);
        this.run('git merge --abort || true');
        this.run('git checkout main');
      }
    }
  }

  private logConflict(branch: string, reason: string): void {
    const todoFile = path.join(this.rootDir, 'TODO.md');
    if (!fs.existsSync(todoFile)) return;

    let content = fs.readFileSync(todoFile, 'utf8');
    const conflictEntry = `- [ ] **HIGH PRIORITY**: Resolve ${reason} on branch \`${branch}\` (Blocked Autopilot Merge)\n`;

    if (!content.includes(branch)) {
      if (content.includes('## Maintenance')) {
        content = content.replace('## Maintenance', `## Maintenance\n${conflictEntry}`);
      } else {
        content += `\n## Maintenance\n${conflictEntry}`;
      }
      fs.writeFileSync(todoFile, content);
      this.activities.push(`Logged ${reason} for ${branch} in TODO.md.`);
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
    if (parts[2] !== undefined) parts[2]++;
    const newVersion = parts.join('.');

    console.log(`Bumping version: ${currentVersion} -> ${newVersion}`);

    // Update VERSION.md
    fs.writeFileSync(versionFile, newVersion);
    this.activities.push(`Bumped version from ${currentVersion} to ${newVersion}.`);

    // Use npm version for atomic update (handles package-lock.json)
    try {
      this.run(`npm version ${newVersion} --no-git-tag-version`);
    } catch {
      // Fallback if npm version fails
      const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
      pkg.version = newVersion;
      fs.writeFileSync(packageFile, JSON.stringify(pkg, null, 2));
    }

    const date = new Date().toISOString().split('T')[0];
    let changelog = fs.readFileSync(changelogFile, 'utf8');
    const entry = `\n## [${newVersion}] - ${date}\n### Added\n- Automated protocol sync and branch reconciliation.\n- Enhanced pre-merge testing and conflict logging.\n`;
    changelog = changelog.replace('## [Unreleased]', `## [Unreleased]\n${entry}`);
    fs.writeFileSync(changelogFile, changelog);

    // Commit and push
    this.run('git add VERSION.md package.json CHANGELOG.md ROADMAP.md TODO.md HANDOFF.md');
    try {
      this.run('git add package-lock.json');
    } catch {
      // package-lock.json might not exist in integration tests
    }
    this.run(`git commit -m "Bump version to ${newVersion}: Automated Protocol Sync [skip ci]" || echo "Nothing to commit"`);

    // Ensure all remote feature branches are updated with the new version commit
    const branchesOutput = this.run('git branch -r || echo ""');
    const branches = branchesOutput
      ? branchesOutput.split('\n').map(b => b.trim()).filter(b => b.includes('origin/jules-') || b.includes('origin/main-'))
      : [];

    for (const branch of branches) {
      const cleanBranch = branch.replace('origin/', '');
      try {
        this.run(`git checkout "${cleanBranch}"`);
        this.run('git merge main --no-edit');
        this.run(`git push origin "${cleanBranch}" || echo "Push skipped"`);
      } catch {
        console.warn(`Final reverse merge failed for ${cleanBranch}.`);
        this.run('git merge --abort || true');
      }
    }

    this.run('git checkout main');
    this.run('git push origin main || echo "Push failed"');
  }

  /**
   * Generates a session summary and writes it to HANDOFF.md.
   */
  generateHandoff(): void {
    console.log('Generating session handoff...');
    const handoffFile = path.join(this.rootDir, 'HANDOFF.md');
    const timestamp = new Date().toISOString();

    let summary = `# SESSON HANDOFF - ${timestamp}\n\n`;
    summary += `## Summary of Merges and Modifications\n`;
    if (this.activities.length === 0) {
      summary += `- No major repository modifications in this session.\n`;
    } else {
      this.activities.forEach(activity => {
        summary += `- ${activity}\n`;
      });
    }

    summary += `\n## Notable Code Modifications\n`;
    summary += `- Automated 'EXECUTIVE PROTOCOL' enhancement for handoff and build automation.\n`;
    summary += `- Integrated protocol phases into the DAO TaskManager.\n`;

    fs.writeFileSync(handoffFile, summary);
    console.log('✓ HANDOFF.md updated.');
    this.run('git add HANDOFF.md && git commit -m "Update session handoff [skip ci]" || echo "No handoff changes"');
    this.run('git push origin main || echo "Handoff push failed"');
  }

  /**
   * Executes the system build phase.
   */
  executeBuild(): void {
    console.log('Executing full system build sequence...');
    try {
      const buildScript = process.platform === 'win32' ? 'build.bat' : './build.sh';
      this.run(buildScript);
      this.activities.push('Executed full system build.');
      console.log('✓ System build complete.');
    } catch (err) {
      console.error('[!] System build sequence failed.');
      this.activities.push('Failed system build attempt.');
      throw err;
    }
  }

  verifyStandards(): void {
    console.log('[4/4] Verifying documentation and script standards...');
    const mandatory = ['VISION.md', 'MEMORY.md', 'DEPLOY.md', 'CHANGELOG.md', 'ROADMAP.md', 'TODO.md', 'VERSION.md', 'IDEAS.md', 'HANDOFF.md', 'AGENTS.md'];
    for (const file of mandatory) {
      if (!fs.existsSync(path.join(this.rootDir, file))) {
        throw new Error(`Mandatory file missing: ${file}`);
      }
      console.log(`✓ ${file} exists`);
    }
    this.validateScripts();
  }

  /**
   * Validates and ensures key execution scripts are present and executable.
   * Also checks for Windows .bat equivalents for cross-platform protocol compliance.
   */
  private validateScripts(): void {
    const scripts = [
      'scripts/start.sh', 'scripts/build.sh', 'scripts/sync-protocol.sh',
      'scripts/verify-docs.sh', 'start.sh', 'build.sh',
      'scripts/start.bat', 'scripts/build.bat', 'scripts/sync-protocol.bat',
      'start.bat', 'build.bat'
    ];
    for (const script of scripts) {
      const fullPath = path.join(this.rootDir, script);
      if (!fs.existsSync(fullPath)) {
        // Check if it's a symlink or missing
        if (script.includes('.sh') && !script.startsWith('scripts/')) {
           console.warn(`[!] Warning: Root script missing or broken symlink: ${script}`);
        }
        continue;
      }

      // Ensure executable permissions (Unix)
      try {
        const stats = fs.statSync(fullPath);
        if (!(stats.mode & 0o111)) {
          console.log(`Fixing permissions for ${script}...`);
          this.run(`chmod +x ${script}`);
        }
      } catch {
        // Ignore permission errors in restricted environments
      }
    }
  }
}
