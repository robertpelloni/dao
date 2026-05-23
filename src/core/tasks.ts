import { Store, globalStore } from '../models/Store';
import { AutonomousTask, TaskStatus } from '../models/types';
import { RepositoryManager } from './repository';

/**
 * Task Manager
 * Oversees the execution and tracking of autonomous development tasks.
 */
export class TaskManager {
  private repoManager: RepositoryManager;

  constructor(private store: Store) {
    this.repoManager = new RepositoryManager();
  }

  /**
   * Registers a new task in the system.
   */
  createTask(title: string, description: string): AutonomousTask {
    const task: AutonomousTask = {
      id: `task-${Date.now()}`,
      title,
      description,
      status: 'PENDING',
      createdAt: Date.now()
    };
    this.store.addTask(task);
    return task;
  }

  /**
   * Executes a pending task.
   */
  async executeTask(taskId: string): Promise<void> {
    const task = this.store.getTask(taskId);
    if (!task || task.status !== 'PENDING') return;

    try {
      this.store.updateTask(taskId, { status: 'IN_PROGRESS' });

      // Here we would typically trigger the AI agent or the repository protocol
      // For now, we integrate it with the RepositoryManager's sync protocol
      console.log(`Executing task: ${task.title}`);

      this.repoManager.syncUpstream();
      this.repoManager.reconcileBranches();
      this.repoManager.finalizeWorkspace();
      this.repoManager.verifyStandards();

      this.store.updateTask(taskId, { status: 'COMPLETED' });
    } catch (error) {
      console.error(`Task execution failed: ${error}`);
      this.store.updateTask(taskId, { status: 'FAILED' });
    }
  }

  getTasks(): AutonomousTask[] {
    return this.store.getTasks();
  }
}

export const globalTaskManager = new TaskManager(globalStore);
