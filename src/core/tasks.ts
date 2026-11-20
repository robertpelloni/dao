import { Store, globalStore } from '../models/Store';
import { AutonomousTask } from '../models/types';

/**
 * Task Manager
 * Oversees the execution and tracking of autonomous development tasks.
 */
export class TaskManager {
  constructor(private store: Store) {}

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

      // The Executive Protocol / RepositoryManager that used to run here
      // (git sync, branch reconciliation, version bumps, pushes) was archived
      // to archive/protocol-bot/ on 2026-11-19. Executing a task must not
      // mutate the repository, so a task now simply completes.
      console.log(`Executing task: ${task.title}`);

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
