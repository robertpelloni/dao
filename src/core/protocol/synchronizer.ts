import { execSync } from 'child_process';
import path from 'path';

/**
 * Component 1: Network Synchronizer Engine
 *
 * Establishes a consistent global state by fetching remotes and updating submodules.
 */
export class NetworkSynchronizer {
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
   * Performs a comprehensive fetch of all remotes and tags.
   */
  async fetchAll(): Promise<void> {
    console.log('[APEP] Fetching all remotes and tags...');
    try {
      this.run('git fetch --all --tags');
    } catch (err) {
      console.warn('[!] Root fetch failed. Continuing with local state.');
    }
  }

  /**
   * Recursively updates all submodules.
   */
  async updateSubmodules(): Promise<void> {
    console.log('[APEP] Updating submodules recursively...');
    try {
      this.run('git submodule foreach --recursive "git fetch --all --tags"');
      this.run('git submodule update --init --recursive --remote');
    } catch (err) {
      console.warn('[!] Submodule update failed or no submodules present.');
    }
  }

  /**
   * Syncs with the upstream parent if configured.
   */
  async syncUpstream(): Promise<void> {
    console.log('[APEP] Syncing with upstream parent...');
    try {
      const remotes = this.run('git remote').split('\n').map(r => r.trim());
      if (remotes.includes('upstream')) {
        this.run('git checkout main');
        this.run('git merge upstream/main --no-edit --allow-unrelated-histories');
        console.log('✓ Successfully merged changes from upstream/main.');
      } else {
        console.log('No upstream remote found. Skipping upstream sync.');
      }
    } catch (err) {
      console.warn('[!] Upstream sync skipped (no changes or merge conflict).');
    }
  }

  /**
   * Full synchronization sequence.
   */
  async execute(): Promise<void> {
    await this.fetchAll();
    await this.updateSubmodules();
    await this.syncUpstream();
  }
}
