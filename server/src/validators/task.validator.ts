import { z } from "zod";
import { TASK_PRIORITIES, TASK_STATUSES } from "../constants/task";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(TASK_PRIORITIES).default("MEDIUM"),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    status: z.enum(TASK_STATUSES).optional(),
    expectedVersion: z.number().int().nonnegative(),
  })
  .refine(
  ({ expectedVersion, ...fields }) => Object.keys(fields).length > 0,
  {
    message: "At least one field must be provided",
  }
);;

export const getTasksQuerySchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});