import React, { useState, useEffect } from 'react';

interface AutonomousTask {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  branchName?: string;
  createdAt: number;
}

const TaskMonitor: React.FC = () => {
  const [tasks, setTasks] = useState<AutonomousTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await fetch('http://localhost:3000/tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const executeTask = async (id: string) => {
    try {
      await fetch(`http://localhost:3000/tasks/${id}/execute`, {
        method: 'POST',
        headers: { 'x-user-id': 'admin' }
      });
      fetchTasks();
    } catch (err) {
      console.error('Failed to execute task', err);
    }
  };

  const createSyncTask = async () => {
    try {
      await fetch('http://localhost:3000/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'admin'
        },
        body: JSON.stringify({
          title: 'Manual Protocol Sync',
          description: 'Triggered from Dashboard'
        })
      });
      fetchTasks();
    } catch (err) {
      console.error('Failed to create task', err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Autonomous Protocol Tasks</h2>
        <button
          onClick={createSyncTask}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          New Sync Task
        </button>
      </div>

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <div className="space-y-4">
          {tasks.length === 0 && <p className="text-gray-500">No autonomous tasks recorded.</p>}
          {tasks.map(task => (
            <div key={task.id} className="border p-4 rounded flex justify-between items-center">
              <div>
                <h3 className="font-bold">{task.title}</h3>
                <p className="text-sm text-gray-600">{task.description}</p>
                <div className="flex gap-4 mt-1 text-xs text-gray-400">
                  <span>ID: {task.id}</span>
                  <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
                  {task.branchName && <span>Branch: {task.branchName}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  task.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                  task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {task.status}
                </span>
                {task.status === 'PENDING' && (
                  <button
                    onClick={() => executeTask(task.id)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Run Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskMonitor;
