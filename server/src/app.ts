import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import taskRoutes from "./routes/task.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Task Manager API is running",
  });
});

app.use("/api/tasks", taskRoutes);

app.use(errorHandler);

export default app;