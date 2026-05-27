import { RepositoryManager } from '../src/core/repository';
import fs from 'fs';
import path from 'path';

describe('RepositoryManager', () => {
  const testRoot = path.join(__dirname, 'repo-test-root');
  let mgr: RepositoryManager;

  beforeAll(() => {
    if (!fs.existsSync(testRoot)) fs.mkdirSync(testRoot);


    // Create mock mandatory files
    const mandatory = ['VISION.md', 'MEMORY.md', 'DEPLOY.md', 'CHANGELOG.md', 'ROADMAP.md', 'TODO.md', 'VERSION.md', 'IDEAS.md', 'HANDOFF.md', 'AGENTS.md', 'package.json'];
    mandatory.forEach(f => {
      if (f === 'package.json') {
        fs.writeFileSync(path.join(testRoot, f), JSON.stringify({ version: '1.0.0' }));
      } else if (f === 'VERSION.md') {
        fs.writeFileSync(path.join(testRoot, f), '1.0.0');
      } else if (f === 'CHANGELOG.md') {
        fs.writeFileSync(path.join(testRoot, f), '# Changelog\n\n## [Unreleased]\n');
      } else {
        fs.writeFileSync(path.join(testRoot, f), '# Mock content');
      }
    });

    mgr = new RepositoryManager(testRoot);
  });

  afterAll(() => {
    fs.rmSync(testRoot, { recursive: true, force: true });
  });

  it('should verify that all mandatory files exist', () => {
    expect(() => mgr.verifyStandards()).not.toThrow();
  });

  it('should fail verification if a file is missing', () => {
    fs.unlinkSync(path.join(testRoot, 'VISION.md'));
    expect(() => mgr.verifyStandards()).toThrow('Mandatory file missing: VISION.md');
    // Restore
    fs.writeFileSync(path.join(testRoot, 'VISION.md'), '# Mock content');
  });

  it('should bump version correctly in VERSION.md and package.json', () => {
    // Mock run method to skip git commands during unit test
    (mgr as any).run = jest.fn((cmd) => {
      if (cmd.includes('npm version')) {
        // Mock the side effect of npm version
        fs.writeFileSync(path.join(testRoot, 'package.json'), JSON.stringify({ version: '1.0.1' }));
      }
      return '';
    });

    mgr.finalizeWorkspace();

    const version = fs.readFileSync(path.join(testRoot, 'VERSION.md'), 'utf8').trim();
    const pkg = JSON.parse(fs.readFileSync(path.join(testRoot, 'package.json'), 'utf8'));
    const changelog = fs.readFileSync(path.join(testRoot, 'CHANGELOG.md'), 'utf8');

    expect(version).toBe('1.0.1');
    expect(pkg.version).toBe('1.0.1');
    expect(changelog).toContain('## [1.0.1]');
  });
});
