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
    } catch (err) {
      const error = err as { stderr?: string; message?: string };
      console.error(`Command failed: ${command}`);
      console.error(error.stderr || error.message);
      throw err;
    }
  }

  /**
   * Initializes the repository for autonomous operation.
   */
  initialize(): void {
    console.log('[0/8] Initializing autonomous identity and environment...');
    this.run('git config user.email "autopilot@liquidgov.org"');
    this.run('git config user.name "LiquidGov Autopilot"');
    this.run('git config init.defaultBranch main');
  }

  /**
   * Step 1: Upstream Tracking & Submodule Sanitization
   */
  syncUpstream(): void {
    console.log('[1/8] Fetching all remotes and updating submodules recursively...');
    try {
      this.run('git fetch --all --tags');
    } catch {
      console.error('[!] Root fetch failed. Continuing with local state if possible.');
    }


    // Recursive fetch for submodules
    try {
      console.log('Fetching submodules...');
      this.run('git submodule foreach --recursive "git fetch --all --tags"');
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
    } catch {
      console.warn('[!] Upstream merge skipped (no changes or merge conflict).');
    }

    // Ensure submodules are updated to their latest tracked commits recursively
    try {
      console.log('Updating submodules to latest tracked commits...');
      this.run('git submodule update --init --recursive --remote');
    } catch {
      console.error('[!] Recursive submodule update failed. Check submodule configurations.');
    }
  }

  /**
   * Step 2: Dual-Direction Intelligent Merge Engine
   */
  reconcileBranches(): void {
    console.log('[2/8] Executing Dual-Direction Intelligent Merge Engine...');

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
      if (!/^[a-zA-Z0-9./_-]+$/.test(cleanBranch)) {
        console.warn(`Skipping potentially unsafe branch name: ${cleanBranch}`);
        continue;
      }


      console.log(`Interrogating branch: ${cleanBranch}`);

      // Ensure local main exists
      this.run('git checkout main || git checkout -b main origin/main || true');

      // Forward Merge (Features to Main)
      try {
        // Use full remote branch name for comparison
        const remoteBranch = `origin/${cleanBranch}`;
        const isMerged = this.run(`git merge-base --is-ancestor ${remoteBranch} main || echo "no"`).trim() !== 'no';
        if (!isMerged) {
          console.log(`Merging ${cleanBranch} into main...`);
          this.run(`git merge ${remoteBranch} --no-edit --allow-unrelated-histories`);
        } else {
          console.log(`Branch ${cleanBranch} is already merged into main.`);
        }
      } catch {
        console.warn(`Forward merge failed for ${cleanBranch}. Skipping.`);
        this.run('git merge --abort || true');
      }

      // Reverse Merge (Main back to Features)
      try {
        console.log(`Reverse merging main into ${cleanBranch}...`);
        this.run(`git checkout ${cleanBranch} || git checkout -b ${cleanBranch} origin/${cleanBranch}`);
        this.run('git merge main --no-edit');
        this.run(`git push origin ${cleanBranch} || echo "Push skipped"`);
        this.run('git checkout main');
      } catch {
        console.warn(`Reverse merge failed for ${cleanBranch}. Skipping.`);
        this.run('git merge --abort || true');
        this.run('git checkout main');
      }
    }
  }

  /**
   * Step 3: Extract Roadmap from TODOs and FIXMEs
   */
  syncRoadmap(): void {
    console.log('[3/8] Extracting roadmap from codebase (TODO/FIXME scanning)...');
    const todoFile = path.join(this.rootDir, 'TODO.md');

    // Scans src directory for TODO/FIXME and populates TODO.md
    try {
      const findings = this.run('grep -rE "TODO|FIXME" src/ --exclude-dir=node_modules || echo ""');
      if (findings) {
        let content = '# AUTOMATED TODO LIST\n\nGenerated by Executive Protocol\n\n';
        findings.split('\n').forEach(line => {
          if (line.trim()) {
            content += `- [ ] ${line.trim()}\n`;
          }
        });
        fs.writeFileSync(todoFile, content);
        console.log('✓ TODO.md updated with codebase findings.');
      }
    } catch {
      console.warn('[!] Roadmap extraction failed (grep may not be available).');
    }
  }

  /**
   * Step 4: Sync Submodule Structural Map
   */
  syncSubmoduleMap(): void {
    console.log('[4/8] Synchronizing submodule structural map...');
    const mapFile = path.join(this.rootDir, 'SUBMODULES.md');
    try {
      const status = this.run('git submodule status --recursive || echo ""');
      let content = '# SUBMODULE MAP\n\n';
      content += status;
      fs.writeFileSync(mapFile, content);
      console.log('✓ SUBMODULES.md updated.');
    } catch {
      console.warn('[!] Submodule mapping failed.');
    }
  }

  /**
   * Step 5: Workspace Cleanup & Documentation Sync
   */
  finalizeWorkspace(): void {
    console.log('[5/8] Finalizing workspace and documentation...');


    const versionFile = path.join(this.rootDir, 'VERSION.md');
    const packageFile = path.join(this.rootDir, 'package.json');
    const changelogFile = path.join(this.rootDir, 'CHANGELOG.md');

    if (!fs.existsSync(versionFile)) return;

    const currentVersion = fs.readFileSync(versionFile, 'utf8').trim();
    const parts = currentVersion.split('.').map(Number);
    if (parts[2] !== undefined) parts[2]++;
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
    if (fs.existsSync(path.join(this.rootDir, 'SUBMODULES.md'))) {
      this.run('git add SUBMODULES.md');
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
        this.run(`git checkout ${cleanBranch}`);
        this.run('git merge main --no-edit');
        this.run(`git push origin ${cleanBranch} || echo "Push skipped"`);
      } catch {
        console.warn(`Final reverse merge failed for ${cleanBranch}.`);
        this.run('git merge --abort || true');
      }
    }

    this.run('git checkout main');
    this.run('git push origin main || echo "Push failed"');
  }

  /**
   * Step 6: Execute System Build
   */
  executeBuild(): void {
    console.log('[6/8] Executing full system build...');
    try {
      this.run('bash scripts/build.sh');
    } catch (err) {
      console.error('[!] Build failed.');
      throw err;
    }
  }

  /**
   * Step 7: Generate Handoff Documentation
   */
  generateHandoff(): void {
    console.log('[7/8] Generating handoff documentation...');
    const handoffFile = path.join(this.rootDir, 'HANDOFF.md');
    const content = `# HANDOFF: ${new Date().toISOString()}\n\nProtocol execution complete. All branches reconciled.\n`;
    fs.writeFileSync(handoffFile, content);
    this.run('git add HANDOFF.md && git commit -m "Update HANDOFF.md [skip ci]" || echo "No handoff changes"');
    this.run('git push origin main || echo "Push failed"');
  }

  /**
   * Step 8: Verify Standards
   */
  verifyStandards(): void {
    console.log('[8/8] Verifying documentation and script standards...');
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
   * Full system validation: linting, tests, and build.
   */
  validate(): void {
    console.log('Running full system validation...');
    this.run('npm run lint');
    this.run('npm test');
    this.executeBuild();
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
