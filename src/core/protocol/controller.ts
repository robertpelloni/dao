import { NetworkSynchronizer } from './synchronizer';
import { MergeEngine } from './merger';
import { ProtocolGovernance } from './governance';
import { ValidationGatekeeper } from './validator';
import { AutonomousDeployer } from './deployer';
import fs from 'fs';
import path from 'path';

/**
 * Unified Executive Protocol Controller
 *
 * Orchestrates the five components of the Autonomous Project Execution Protocol.
 */
export class ExecutiveProtocol {
  private synchronizer: NetworkSynchronizer;
  private merger: MergeEngine;
  private governance: ProtocolGovernance;
  private validator: ValidationGatekeeper;
  private deployer: AutonomousDeployer;
  private rootDir: string;

  constructor(rootDir: string = path.join(__dirname, '../../../')) {
    this.rootDir = rootDir;
    this.synchronizer = new NetworkSynchronizer(rootDir);
    this.merger = new MergeEngine(rootDir);
    this.governance = new ProtocolGovernance(rootDir);
    this.validator = new ValidationGatekeeper(rootDir);
    this.deployer = new AutonomousDeployer(rootDir);
  }

  /**
   * Primary execution loop for the protocol.
   */
  async run(options: { skipPush?: boolean } = {}): Promise<void> {
    console.log('=== LiquidGov EXECUTIVE PROTOCOL: Autonomous Core Engine Start ===');

    try {
      // 1. Establish global state
      await this.synchronizer.execute();

      // 2. Reconcile feature work
      await this.merger.execute();

      // 3. Update administration and metadata
      const versionFile = path.join(this.rootDir, 'VERSION.md');
      await this.governance.execute();
      const newVersion = fs.readFileSync(versionFile, 'utf8').trim();

      // 4. Validate system integrity
      await this.validator.execute();

      // 5. Finalize and Deploy
      if (!options.skipPush) {
        await this.deployer.execute(newVersion);
      } else {
        console.log('[SKIP] Push and final deployment skipped in local mode.');
      }

      console.log(`=== Protocol Execution Complete: Release v${newVersion} established. ===`);
    } catch (err) {
      console.error('!!! EXECUTIVE PROTOCOL CRITICAL FAILURE !!!');
      console.error(err);
      process.exit(1);
    }
  }
}

// Export the singleton controller
export const globalProtocol = new ExecutiveProtocol();
