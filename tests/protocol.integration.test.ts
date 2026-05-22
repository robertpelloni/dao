import { RepositoryManager } from '../src/core/repository';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Integration Test for Executive Protocol
 * This test creates a temporary git environment to verify merging and sync logic.
 */

describe('Protocol Integration', () => {
  const baseDir = path.join(__dirname, 'integration-tmp');
  const remoteDir = path.join(baseDir, 'remote');
  const localDir = path.join(baseDir, 'local');

  function run(cmd: string, cwd: string) {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: 'pipe' });
  }

  beforeAll(() => {
    if (fs.existsSync(baseDir)) fs.rmSync(baseDir, { recursive: true, force: true });
    fs.mkdirSync(baseDir, { recursive: true });
    fs.mkdirSync(remoteDir);
    fs.mkdirSync(localDir);

    // Setup Remote Repo
    run('git init --bare', remoteDir);

    // Setup Local Repo and Initial Commit
    run('git init', localDir);
    run('git config user.email "test@test.com"', localDir);
    run('git config user.name "Tester"', localDir);

    // Create mandatory files
    const mandatory = ['VISION.md', 'MEMORY.md', 'DEPLOY.md', 'CHANGELOG.md', 'ROADMAP.md', 'TODO.md', 'VERSION.md', 'IDEAS.md', 'HANDOFF.md', 'AGENTS.md'];
    mandatory.forEach(f => {
       if (f === 'VERSION.md') fs.writeFileSync(path.join(localDir, f), '0.1.0');
       else if (f === 'CHANGELOG.md') fs.writeFileSync(path.join(localDir, f), '# Changelog\n\n## [Unreleased]\n');
       else fs.writeFileSync(path.join(localDir, f), '# Mock');
    });
    fs.writeFileSync(path.join(localDir, 'package.json'), JSON.stringify({ version: '0.1.0' }));

    run('git add .', localDir);
    run('git commit -m "Initial commit"', localDir);
    run(`git remote add origin ${remoteDir}`, localDir);
    run('git push -u origin main', localDir);
  });

  afterAll(() => {
    fs.rmSync(baseDir, { recursive: true, force: true });
  });

  it('should reconcile feature branches and bump version', () => {
    // 1. Create a remote feature branch manually
    const featDir = path.join(baseDir, 'feat-clone');
    fs.mkdirSync(featDir);
    run(`git clone ${remoteDir} .`, featDir);
    run('git checkout -b jules-feature-1', featDir);
    fs.writeFileSync(path.join(featDir, 'feature.txt'), 'new feature');
    run('git add .', featDir);
    run('git commit -m "Add feature"', featDir);
    run('git push origin jules-feature-1', featDir);

    // 2. Run RepositoryManager on the local repo
    const mgr = new RepositoryManager(localDir);
    mgr.syncUpstream();
    mgr.reconcileBranches();
    mgr.finalizeWorkspace();
    mgr.verifyStandards();

    // 3. Verify merges and version
    const version = fs.readFileSync(path.join(localDir, 'VERSION.md'), 'utf8').trim();
    expect(version).toBe('0.1.1');

    // Check if feature file exists in main
    run('git checkout main', localDir);
    expect(fs.existsSync(path.join(localDir, 'feature.txt'))).toBe(true);

    // Check if main merged back into feature
    run('git checkout jules-feature-1', localDir);
    const pkg = JSON.parse(fs.readFileSync(path.join(localDir, 'package.json'), 'utf8'));
    expect(pkg.version).toBe('0.1.1');
  });
});
