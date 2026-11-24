import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { ACTIVITY_ACTIONS } from "../constants/activity";
import { ConflictError } from "../errors/ConflictError";

interface CreateTaskInput {
  title: string;
  description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  expectedVersion: number;
}

interface GetTasksInput {
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  search?: string;
  page: number;
  pageSize: number;
}

export async function createTask(data: CreateTaskInput) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const task = await tx.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
      },
    });

    await tx.taskActivity.create({
      data: {
        taskId: task.id,
        action: ACTIVITY_ACTIONS.CREATED,
        newValues: JSON.stringify(task),
      },
    });

    return task;
  });
}

export async function getTasks(filters: GetTasksInput) {
  const where: Prisma.TaskWhereInput = {
    ...(filters.status && { status: filters.status }),
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.search && {
      OR: [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ],
    }),
  };

  const skip = (filters.page - 1) * filters.pageSize;

  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: filters.pageSize,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.ceil(total / filters.pageSize),
    },
  };
}

export async function getTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id },
  });
}
export async function updateTask(id: string, data: UpdateTaskInput) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const { expectedVersion, ...updateData } = data;

    const existingTask = await tx.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return null;
    }

    if (existingTask.version !== expectedVersion) {
      throw new ConflictError(
        "Task was modified by another request. Please reload and try again."
      );
    }

    const result = await tx.task.updateMany({
      where: {
        id,
        version: expectedVersion,
      },
      data: {
        ...updateData,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      throw new ConflictError(
        "Task was modified by another request. Please reload and try again."
      );
    }

    const updatedTask = await tx.task.findUniqueOrThrow({
      where: { id },
    });

    const statusChanged = existingTask.status !== updatedTask.status;

    await tx.taskActivity.create({
      data: {
        taskId: id,
        action: statusChanged
          ? ACTIVITY_ACTIONS.STATUS_CHANGED
          : ACTIVITY_ACTIONS.UPDATED,
        oldValues: JSON.stringify(existingTask),
        newValues: JSON.stringify(updatedTask),
      },
    });

    return updatedTask;
  });
}
export async function deleteTask(id: string) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existingTask = await tx.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return null;
    }

    await tx.taskActivity.create({
      data: {
        taskId: id,
        action: ACTIVITY_ACTIONS.DELETED,
        oldValues: JSON.stringify(existingTask),
      },
    });

    await tx.task.delete({
      where: { id },
    });

    return existingTask;
  });
}
export async function getTaskActivities(taskId: string) {
  const activities = await prisma.taskActivity.findMany({
    where: { taskId },
    orderBy: [
  { createdAt: "asc" },
  { id: "asc" },
],
  });

  return activities.length > 0 ? activities : null;
}