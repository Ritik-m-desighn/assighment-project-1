
import { useEffect, useState } from "react";
import {
  getTasks,
  updateTask,
  deleteTask,
  type Task,
} from "./api/taskApi";
import TaskForm from "./components/TaskForm";
import TaskDetails from "./components/TaskDetails";
import EditTaskForm from "./components/EditTaskForm";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [success, setSuccess] = useState("");

  async function refreshTasks() {
    const result = await getTasks({
      status: status || undefined,
      priority: priority || undefined,
      search: search || undefined,
      page,
      pageSize: 10,
    });

    setTasks(result.tasks);
    setPagination(result.pagination);
  }

  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true);
        setError("");
        await refreshTasks();
      } catch {
        setError("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, [status, priority, search, page]);

  async function handleStatusChange(
  task: Task,
  newStatus: Task["status"]
) {
  try {
    setError("");
    setSuccess("");

    await updateTask(task.id, {
      status: newStatus,
      expectedVersion: task.version,
    });

    setSuccess("Task status updated successfully!");
    await refreshTasks();
  } catch {
    setError("Failed to update task status. Please reload and try again.");
  }
}async function handleDeleteTask(id: string) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this task?"
  );

  if (!confirmed) return;

  try {
    setError("");
    setSuccess("");

    await deleteTask(id);

    setSuccess("Task deleted successfully!");
    await refreshTasks();
  } catch {
    setError("Failed to delete task");
  }
}
  return (
    <div>
      <header>
        <h1>Task Manager</h1>
        <p>Organize your work and track your progress.</p>
      </header>

      <main>
        <section>
          <h2>Your Tasks</h2>

          <div>
            <input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>

            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

         <TaskForm
  onTaskCreated={async () => {
    setSuccess("Task created successfully!");
    setError("");

    if (page !== 1) {
      setPage(1);
    } else {
      await refreshTasks();
    }
  }}
/>

          {loading && <p>Loading tasks...</p>}

          {error && <p>{error}</p>}
          {success && <p className="success-message">{success}</p>}

          {!loading && !error && tasks.length === 0 && (
            <p>No tasks found. Create a task or change your filters.</p>
          )}

          {tasks.map((task) => (
            <article key={task.id} className="task-card">
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <p>Priority: {task.priority}</p>

              <p className="task-status-label">
                Current status: {task.status.replace("_", " ")}
              </p>

              <select
                className="status-select"
                value={task.status}
                onChange={(e) =>
                  handleStatusChange(
                    task,
                    e.target.value as Task["status"]
                  )
                }
              >
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>

              <button onClick={() => setEditingTask(task)}>
                Edit
              </button>

              <button onClick={() => handleDeleteTask(task.id)}>
                Delete
              </button>

              <button onClick={() => setSelectedTask(task)}>
                View Details
              </button>

              {editingTask?.id === task.id && (
                <EditTaskForm
                  task={editingTask}
                  onSaved={async () => {
  setEditingTask(null);
  setSuccess("Task updated successfully!");
  setError("");
  await refreshTasks();
}}
                  onCancel={() => setEditingTask(null)}
                />
              )}
            </article>
          ))}

          {!loading && pagination.totalPages > 0 && (
            <div className="pagination">
              <p>
                Page {pagination.page} of {pagination.totalPages}
                {" · "}
                Total tasks: {pagination.total}
              </p>

              <button
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>

              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          )}

          {selectedTask && (
            <TaskDetails
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
            />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
