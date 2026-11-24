import { Router } from "express";
import {
  createTaskController,
  getTasksController,
  getTaskByIdController,
  updateTaskController,
  deleteTaskController,
  getTaskActivitiesController,
} from "../controllers/task.controller";

const router = Router();

router.get("/", getTasksController);
router.get("/:id/activities", getTaskActivitiesController);
router.get("/:id", getTaskByIdController);
router.post("/", createTaskController);
router.patch("/:id", updateTaskController);
router.delete("/:id", deleteTaskController);

export default router;