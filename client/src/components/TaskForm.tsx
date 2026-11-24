import { useState } from "react";
import { createTask } from "../api/taskApi";

interface TaskFormProps {
  onTaskCreated: () => void;
}

function TaskForm({ onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await createTask({ title, description, priority });

      setTitle("");
      setDescription("");
      setPriority("MEDIUM");

      onTaskCreated();
    } catch {
      setError("Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        required
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />

      <select
        value={priority}
        onChange={(e) =>
          setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")
        }
      >
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </select>

      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Task"}
      </button>

      {error && <p>{error}</p>}
    </form>
  );
}

export default TaskForm;