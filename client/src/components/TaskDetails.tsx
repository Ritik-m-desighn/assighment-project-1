import { useEffect, useState } from "react";
import { getTaskActivities, type TaskActivity, type Task } from "../api/taskApi";

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
}

function TaskDetails({ task, onClose }: TaskDetailsProps) {
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadActivities() {
      try {
        const data = await getTaskActivities(task.id);
        setActivities(data);
      } catch {
        setError("Failed to load activity history");
      } finally {
        setLoading(false);
      }
    }

    loadActivities();
  }, [task.id]);

  return (
    <div>
      <h2>{task.title}</h2>
      <p>{task.description}</p>
      <p>Status: {task.status}</p>
      <p>Priority: {task.priority}</p>
      <p>Created: {new Date(task.createdAt).toLocaleString()}</p>

      <h3>Activity History</h3>

      {loading && <p>Loading history...</p>}
      {error && <p>{error}</p>}

      {activities.map((activity) => {
  const oldData = activity.oldValues
    ? JSON.parse(activity.oldValues)
    : null;

  const newData = activity.newValues
    ? JSON.parse(activity.newValues)
    : null;

  return (
    <article key={activity.id}>
      <h4>{activity.action}</h4>
      <p>{new Date(activity.createdAt).toLocaleString()}</p>

      {oldData && newData && (
        <>
          {Object.keys(newData)
            .filter(
              (key) =>
                oldData[key] !== newData[key] &&
                ["title", "description", "status", "priority"].includes(key)
            )
            .map((key) => (
              <p key={key}>
                {key}: {String(oldData[key] ?? "Empty")} →{" "}
                {String(newData[key] ?? "Empty")}
              </p>
            ))}
        </>
      )}
    </article>
  );
})}

      {!loading && !error && activities.length === 0 && (
        <p>No activity history.</p>
      )}

      <button onClick={onClose}>Close</button>
    </div>
  );
}

export default TaskDetails;