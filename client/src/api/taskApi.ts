import api from "./axios";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface TaskListResponse {
  tasks: Task[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
}

export async function getTasks(params?: {
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const response = await api.get("/tasks", { params });


  return response.data.data as TaskListResponse;
}
export async function createTask(data: CreateTaskInput) {
  const response = await api.post("/tasks", data);
  return response.data.data as Task;
}
export async function updateTask(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    status?: Task["status"];
    priority?: Task["priority"];
    expectedVersion: number;
  }
) {
  const response = await api.patch(`/tasks/${id}`, data);
  return response.data.data as Task;
}
export async function deleteTask(id: string) {
  await api.delete(`/tasks/${id}`);
}
export interface TaskActivity {
  id: string;
  taskId: string;
  action: string;
  oldValues: string | null;
  newValues: string | null;
  createdAt: string;
}

export async function getTaskActivities(id: string) {
  const response = await api.get(`/tasks/${id}/activities`);
  return response.data.data as TaskActivity[];
}