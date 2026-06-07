import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Component 4: Validation Gatekeeper
 *
 * Enforces quality standards through tests, builds, and documentation checks.
 */
export class ValidationGatekeeper {
  constructor(private rootDir: string = path.join(__dirname, '../../../')) {}

  private run(command: string): string {
    try {
      return execSync(command, { cwd: this.rootDir, encoding: 'utf8' });
    } catch (err) {
      const error = err as { stderr?: string; message?: string };
      throw new Error(`Validation Failed: ${command}\n${error.stderr || error.message}`);
    }
  }

  /**
   * Verifies that all mandatory documentation files exist.
   */
  async checkDocs(): Promise<void> {
    console.log('[APEP] Verifying documentation standards...');
    const mandatory = ['VISION.md', 'MEMORY.md', 'DEPLOY.md', 'CHANGELOG.md', 'ROADMAP.md', 'TODO.md', 'VERSION.md', 'IDEAS.md', 'HANDOFF.md', 'AGENTS.md', 'PROTOCOL_SPEC.md'];
    for (const file of mandatory) {
      if (!fs.existsSync(path.join(this.rootDir, file))) {
        throw new Error(`Mandatory document missing: ${file}`);
      }
    }
    console.log('✓ All mandatory documents are present.');
  }

  /**
   * Runs the backend test suite.
   */
  async runTests(): Promise<void> {
    console.log('[APEP] Running backend test suite...');
    this.run('npm test');
    console.log('✓ All tests passed.');
  }

  /**
   * Verifies the full system build.
   */
  async verifyBuild(): Promise<void> {
    console.log('[APEP] Verifying system build...');
    this.run('bash scripts/build.sh');
    console.log('✓ System build successful.');
  }

  /**
   * Execution logic for validation.
   */
  async execute(): Promise<void> {
    await this.checkDocs();
    await this.runTests();
    await this.verifyBuild();
  }
}
