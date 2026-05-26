import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { RepositoryManager } from '../src/core/repository';

/**
 * Integration Test for Executive Protocol
 * Simulates a complex git environment with multiple branches and submodules.
 */
describe('Executive Protocol Full Integration', () => {
  const testRoot = path.join(__dirname, 'full-integration-tmp');
  const remotePath = path.join(testRoot, 'remote');
  const localPath = path.join(testRoot, 'local');
  let mgr: RepositoryManager;

  beforeAll(() => {
    if (fs.existsSync(testRoot)) {
        fs.rmSync(testRoot, { recursive: true });
    }
    fs.mkdirSync(testRoot, { recursive: true });

    // Setup Mock Remote
    if (fs.existsSync(remotePath)) fs.rmSync(remotePath, { recursive: true, force: true });
    fs.mkdirSync(remotePath, { recursive: true });
    execSync('git init --bare', { cwd: remotePath });

    // Initial Local setup to push to remote
    const initPath = path.join(testRoot, 'init');
    if (fs.existsSync(initPath)) fs.rmSync(initPath, { recursive: true, force: true });
    fs.mkdirSync(initPath, { recursive: true });
    execSync('git init', { cwd: initPath });
    execSync('git config user.email "test@example.com"', { cwd: initPath });
    execSync('git config user.name "Test User"', { cwd: initPath });
    execSync('git branch -m main', { cwd: initPath });

    fs.writeFileSync(path.join(initPath, 'VERSION.md'), '0.1.0');
    fs.writeFileSync(path.join(initPath, 'package.json'), JSON.stringify({
      name: 'test',
      version: '0.1.0',
      scripts: { test: 'echo "Success"' }
    }, null, 2));
    fs.writeFileSync(path.join(initPath, 'CHANGELOG.md'), '## [Unreleased]\n');

    // Create mandatory files
    ['VISION.md', 'MEMORY.md', 'DEPLOY.md', 'ROADMAP.md', 'TODO.md', 'IDEAS.md', 'HANDOFF.md', 'AGENTS.md'].forEach(f => {
        fs.writeFileSync(path.join(initPath, f), '# ' + f);
    });

    execSync('git add .', { cwd: initPath });
    execSync('git commit -m "Initial commit"', { cwd: initPath });
    execSync(`git remote add origin ${remotePath}`, { cwd: initPath });
    execSync('git push origin main', { cwd: initPath });

    // Setup Feature Branch in Remote
    execSync('git checkout -b jules-feature-1', { cwd: initPath });
    fs.writeFileSync(path.join(initPath, 'feature.txt'), 'new feature');
    execSync('git add feature.txt', { cwd: initPath });
    execSync('git commit -m "Add feature"', { cwd: initPath });
    execSync('git push origin jules-feature-1', { cwd: initPath });

    // Clone to "local" where we run the manager
    execSync(`git clone ${remotePath} local`, { cwd: testRoot });
    mgr = new RepositoryManager(localPath);

    // Config local identity
    execSync('git config user.email "autopilot@liquidgov.org"', { cwd: localPath });
    execSync('git config user.name "LiquidGov Autopilot"', { cwd: localPath });
  });

  afterAll(() => {
    if (fs.existsSync(testRoot)) {
        fs.rmSync(testRoot, { recursive: true });
    }
  });

  it('should execute the full protocol lifecycle', () => {
    process.env.SKIP_PROTOCOL_TESTS = 'true';
    // 1. Sync Upstream
    mgr.syncUpstream();

    // 2. Reconcile Branches (should merge jules-feature-1 into main)
    mgr.reconcileBranches();

    const branches = execSync('git branch', { cwd: localPath, encoding: 'utf8' });
    expect(branches).toContain('main');

    // Verify forward merge
    execSync('git checkout main', { cwd: localPath });
    expect(fs.existsSync(path.join(localPath, 'feature.txt'))).toBe(true);

    // Create root scripts to avoid verification warnings/errors
    fs.writeFileSync(path.join(localPath, 'start.sh'), '#!/bin/bash');
    fs.writeFileSync(path.join(localPath, 'build.sh'), '#!/bin/bash');
    fs.mkdirSync(path.join(localPath, 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(localPath, 'scripts/start.sh'), '#!/bin/bash');
    fs.writeFileSync(path.join(localPath, 'scripts/build.sh'), '#!/bin/bash');
    fs.writeFileSync(path.join(localPath, 'scripts/sync-protocol.sh'), '#!/bin/bash');

    // 3. Finalize Workspace (bump version)
    mgr.finalizeWorkspace();

    const ver = fs.readFileSync(path.join(localPath, 'VERSION.md'), 'utf8').trim();
    expect(ver).toBe('0.1.1');

    const pkg = JSON.parse(fs.readFileSync(path.join(localPath, 'package.json'), 'utf8'));
    expect(pkg.version).toBe('0.1.1');

    // 4. Execute Build (mock build script)
    fs.writeFileSync(path.join(localPath, 'build.sh'), '#!/bin/bash\necho "Building..."');
    fs.chmodSync(path.join(localPath, 'build.sh'), 0o755);
    mgr.executeBuild();

    // 5. Generate Handoff
    mgr.generateHandoff();
    expect(fs.existsSync(path.join(localPath, 'HANDOFF.md'))).toBe(true);
    const handoff = fs.readFileSync(path.join(localPath, 'HANDOFF.md'), 'utf8');
    expect(handoff).toContain('Merged feature branch jules-feature-1 into main.');
    expect(handoff).toContain('Bumped version from 0.1.0 to 0.1.1.');

    // 6. Verify Standards
    expect(() => mgr.verifyStandards()).not.toThrow();
  });
});
