import { RepositoryManager } from './repository';
import { TaskManager, globalTaskManager } from './tasks';
import { Store, globalStore } from '../models/Store';

/**
 * Autonomous Watchdog
 *
 * Periodically triggers the Executive Protocol to ensure the repository
 * remains synchronized and branches are reconciled without manual intervention.
 */
export class AutonomousWatchdog {
  private intervalHandle: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(
    private repoManager: RepositoryManager,
    private taskManager: TaskManager,
    private intervalMs: number = 300000 // Default: 5 minutes
  ) {}

  /**
   * Starts the autonomous background loop.
   */
  start(): void {
    if (this.intervalHandle) return;
    console.log(`[Watchdog] Starting autonomous background loop (Interval: ${this.intervalMs}ms)`);

    this.intervalHandle = setInterval(() => this.tick(), this.intervalMs);
    // Trigger immediate first run
    this.tick();
  }

  /**
   * Stops the background loop.
   */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  /**
   * A single iteration of the watchdog logic.
   */
  private async tick(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      console.log('[Watchdog] Checking for synchronization needs...');

      // We create a task to track this automated run
      const task = this.taskManager.createTask(
        'Scheduled Protocol Sync',
        'Automatically triggered by background watchdog'
      );

      await this.taskManager.executeTask(task.id);

      console.log('[Watchdog] Synchronization cycle complete.');
    } catch (err) {
      console.error('[Watchdog] Cycle failed:', err);
    } finally {
      this.isRunning = false;
    }
  }
}

export const globalWatchdog = new AutonomousWatchdog(
  new RepositoryManager(),
  globalTaskManager
);
