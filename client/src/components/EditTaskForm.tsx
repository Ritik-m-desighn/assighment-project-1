import { useState } from "react";
import { updateTask, type Task } from "../api/taskApi";

interface EditTaskFormProps {
  task: Task;
  onSaved: () => void;
  onCancel: () => void;
}

function EditTaskForm({ task, onSaved, onCancel }: EditTaskFormProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await updateTask(task.id, {
        title,
        description,
        priority,
        expectedVersion: task.version,
      });

      onSaved();
    } catch {
      setError("Failed to update task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <select
        value={priority}
        onChange={(e) =>
          setPriority(e.target.value as Task["priority"])
        }
      >
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </select>

      <button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </button>

      <button type="button" onClick={onCancel}>
        Cancel
      </button>

      {error && <p>{error}</p>}
    </form>
  );
}

export default EditTaskForm;