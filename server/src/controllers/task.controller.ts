import { Request, Response, NextFunction } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskActivities,
} from "../services/task.service";
import {
  createTaskSchema,
  getTasksQuerySchema,
  updateTaskSchema,
} from "../validators/task.validator";

export async function createTaskController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const validation = createTaskSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: {
          message: "Invalid task data",
          details: validation.error.flatten(),
        },
      });
      return;
    }

    const task = await createTask(validation.data);

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTasksController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const validation = getTasksQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: {
          message: "Invalid query parameters",
          details: validation.error.flatten(),
        },
      });
      return;
    }

    const result = await getTasks(validation.data);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTaskByIdController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const taskId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const task = await getTaskById(taskId);

    if (!task) {
      res.status(404).json({
        success: false,
        error: {
          message: "Task not found",
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTaskController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const validation = updateTaskSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: {
          message: "Invalid task data",
          details: validation.error.flatten(),
        },
      });
      return;
    }

    const taskId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const task = await updateTask(taskId, validation.data);

    if (!task) {
      res.status(404).json({
        success: false,
        error: {
          message: "Task not found",
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTaskController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const taskId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const task = await deleteTask(taskId);

    if (!task) {
      res.status(404).json({
        success: false,
        error: {
          message: "Task not found",
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
}
export async function getTaskActivitiesController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const taskId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const activities = await getTaskActivities(taskId);

    if (!activities) {
      res.status(404).json({
        success: false,
        error: {
          message: "Task or activity history not found",
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
}