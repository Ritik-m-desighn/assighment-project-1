
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import prisma from "../lib/prisma.js";

// API Health Check
describe("API health check", () => {
  it("should confirm that the API is running", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "Task Manager API is running"
    );
  });
});

// Task Creation
describe("Task creation", () => {
  it("should create a task and record its activity", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .send({
        title: "Test task",
        description: "Created through automated testing",
        priority: "HIGH",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe("Test task");
    expect(response.body.data.priority).toBe("HIGH");

    const taskId = response.body.data.id;

    const activityResponse = await request(app).get(
      `/api/tasks/${taskId}/activities`
    );

    expect(activityResponse.status).toBe(200);
    expect(activityResponse.body.data).toHaveLength(1);
    expect(activityResponse.body.data[0].action).toBe("CREATED");
  });
});

// Task Updates
describe("Task updates", () => {
  it("should update task status and record the change", async () => {
    const createResponse = await request(app)
      .post("/api/tasks")
      .send({
        title: "Update test",
        priority: "MEDIUM",
      });

    expect(createResponse.status).toBe(201);

    const taskId = createResponse.body.data.id;

    const updateResponse = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .send({
        status: "IN_PROGRESS",
        expectedVersion: createResponse.body.data.version,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.status).toBe("IN_PROGRESS");

    const historyResponse = await request(app).get(
      `/api/tasks/${taskId}/activities`
    );

    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body.data).toHaveLength(2);
    expect(historyResponse.body.data[1].action).toBe(
      "STATUS_CHANGED"
    );
  });

  it("should reject an empty update request", async () => {
    const createResponse = await request(app)
      .post("/api/tasks")
      .send({
        title: "Empty update test",
      });

    expect(createResponse.status).toBe(201);

    const taskId = createResponse.body.data.id;

    const response = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

// Task Deletion
describe("Task deletion", () => {
  it("should delete a task but preserve its activity history", async () => {
    const createResponse = await request(app)
      .post("/api/tasks")
      .send({
        title: "Delete test",
        priority: "LOW",
      });

    expect(createResponse.status).toBe(201);

    const taskId = createResponse.body.data.id;

    const deleteResponse = await request(app).delete(
      `/api/tasks/${taskId}`
    );

    expect(deleteResponse.status).toBe(200);

    const taskResponse = await request(app).get(
      `/api/tasks/${taskId}`
    );

    expect(taskResponse.status).toBe(404);

    const historyResponse = await request(app).get(
      `/api/tasks/${taskId}/activities`
    );

    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body.data).toHaveLength(2);
    expect(historyResponse.body.data[1].action).toBe("DELETED");
  });
});

// Task Validation
describe("Task validation", () => {
  it("should reject a task with an empty title", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .send({
        title: "   ",
        priority: "HIGH",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should reject an invalid priority", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .send({
        title: "Invalid task",
        priority: "URGENT",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

// Not Found Handling
describe("Not found handling", () => {
  it("should return 404 for a task that does not exist", async () => {
    const response = await request(app).get(
      "/api/tasks/non-existent-task-id"
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("should return 404 when an unknown task has no activity history", async () => {
    const response = await request(app).get(
      "/api/tasks/non-existent-task-id/activities"
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
describe("Task listing", () => {
  it("should filter tasks using search and priority", async () => {
    const searchTerm = `UniqueSearchTask-${Date.now()}`;

    await request(app).post("/api/tasks").send({
      title: `${searchTerm} Alpha`,
      priority: "HIGH",
    });

    await request(app).post("/api/tasks").send({
      title: `${searchTerm} Beta`,
      priority: "LOW",
    });

    const response = await request(app).get(
      `/api/tasks?search=${searchTerm}&priority=HIGH`
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tasks).toHaveLength(1);
    expect(response.body.data.tasks[0].title).toBe(
      `${searchTerm} Alpha`
    );
  });
});

it("should return the requested page size", async () => {
  const searchTerm = `PaginationTest-${Date.now()}`;

  for (let i = 1; i <= 3; i++) {
    await request(app).post("/api/tasks").send({
      title: `${searchTerm} ${i}`,
      priority: "MEDIUM",
    });
  }

  const response = await request(app).get(
    `/api/tasks?search=${searchTerm}&page=1&pageSize=2`
  );

  expect(response.status).toBe(200);
  expect(response.body.data.tasks).toHaveLength(2);
  expect(response.body.data.pagination.page).toBe(1);
  expect(response.body.data.pagination.pageSize).toBe(2);
  expect(response.body.data.pagination.total).toBe(3);
  expect(response.body.data.pagination.totalPages).toBe(2);
});
describe("Transaction safety", () => {
  it("should roll back task creation if activity logging fails", async () => {
    const title = `RollbackTest-${Date.now()}`;

    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER fail_activity_insert
      BEFORE INSERT ON "TaskActivity"
      BEGIN
        SELECT RAISE(ABORT, 'Forced activity failure');
      END;
    `);

    try {
      const response = await request(app)
        .post("/api/tasks")
        .send({
          title,
          priority: "HIGH",
        });

      expect(response.status).toBe(500);

      const task = await prisma.task.findFirst({
        where: { title },
      });

      expect(task).toBeNull();
    } finally {
      await prisma.$executeRawUnsafe(
        "DROP TRIGGER IF EXISTS fail_activity_insert"
      );
    }
  });
});
it("should reject updates with an outdated version", async () => {
  const createResponse = await request(app)
    .post("/api/tasks")
    .send({
      title: "Concurrency Test",
      priority: "HIGH",
    });

  const taskId = createResponse.body.data.id;
  const version = createResponse.body.data.version;

  // First update succeeds.
  const firstUpdate = await request(app)
    .patch(`/api/tasks/${taskId}`)
    .send({
      status: "IN_PROGRESS",
      expectedVersion: version,
    });

  expect(firstUpdate.status).toBe(200);
  expect(firstUpdate.body.data.version).toBe(version + 1);

  // Second update uses the old version.
  const secondUpdate = await request(app)
    .patch(`/api/tasks/${taskId}`)
    .send({
      status: "DONE",
      expectedVersion: version,
    });

  expect(secondUpdate.status).toBe(409);
  expect(secondUpdate.body.error.message).toContain("modified");

  // The first update must remain unchanged.
  const task = await request(app).get(`/api/tasks/${taskId}`);

  expect(task.body.data.status).toBe("IN_PROGRESS");
  expect(task.body.data.version).toBe(version + 1);
});
it("should reject invalid task filters", async () => {
  const response = await request(app)
    .get("/api/tasks?status=INVALID");

  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
});
it("should search tasks by description", async () => {
  const searchTerm = `UniqueDescription-${Date.now()}`;

  await request(app)
    .post("/api/tasks")
    .send({
      title: "Search Test",
      description: `This contains ${searchTerm}`,
      priority: "MEDIUM",
    });

  const response = await request(app)
    .get(`/api/tasks?search=${searchTerm}`);

  expect(response.status).toBe(200);
  expect(response.body.data.tasks.length).toBe(1);
  expect(response.body.data.tasks[0].title).toBe("Search Test");
});
it("should record old and new values when updating a task", async () => {
  const createResponse = await request(app)
    .post("/api/tasks")
    .send({
      title: "Activity Test",
      priority: "LOW",
    });

  const taskId = createResponse.body.data.id;

  await request(app)
    .patch(`/api/tasks/${taskId}`)
    .send({
      title: "Updated Activity Test",
      expectedVersion: createResponse.body.data.version,
    });

  const historyResponse = await request(app)
    .get(`/api/tasks/${taskId}/activities`);

  const updateActivity = historyResponse.body.data.find(
    (activity: any) => activity.action === "UPDATED"
  );

  expect(updateActivity).toBeDefined();
  expect(JSON.parse(updateActivity.oldValues).title).toBe("Activity Test");
  expect(JSON.parse(updateActivity.newValues).title).toBe("Updated Activity Test");
});