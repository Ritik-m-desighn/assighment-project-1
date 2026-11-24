# Task Manager — Mini Workflow Engine

A full-stack task management application built with React, TypeScript, Node.js, Express, Prisma, and SQLite.

Users can create tasks, update their details, track task status and priority, filter and search tasks, and view an activity history of changes.

## Features

- Create, view, update, and delete tasks.
- Track task status: `TODO`, `IN_PROGRESS`, `DONE`.
- Set task priority: `LOW`, `MEDIUM`, `HIGH`.
- Filter tasks by status and priority.
- Search tasks by title and description.
- Paginate task results.
- View task activity history.
- Record task creation, updates, status changes, and deletion.
- Validate request data and return consistent API errors.
- Detect conflicting updates using optimistic concurrency control.

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Axios

**Backend**
- Node.js
- Express
- TypeScript
- Zod

**Database**
- SQLite
- Prisma ORM

**Testing**
- Vitest
- Supertest

## Project Structure

```text
.
├── client/
│   └── src/
│       ├── api/
│       ├── components/
│       └── App.tsx
│
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   └── src/
│       ├── constants/
│       ├── controllers/
│       ├── errors/
│       ├── lib/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       ├── tests/
│       └── validators/
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm

### 1. Clone the repository

```bash
git clone https://github.com/Ritik-m-desighn/assighment-project-1.git
cd assighment-project-1
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file using `.env.example`:

```env
PORT=5000
DATABASE_URL="file:./dev.db"
```

Generate the Prisma client and apply migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

Start the backend:

```bash
npm run dev
```

The backend runs on `http://localhost:5000`.

### 3. Set up the frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

## API Endpoints

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/tasks` | Create a task |
| GET | `/tasks` | List tasks with filtering, search, and pagination |
| GET | `/tasks/:id` | Get a task by ID |
| PATCH | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |
| GET | `/tasks/:id/activities` | Get task activity history |

### Task listing query parameters

- `status` — filter by task status.
- `priority` — filter by priority.
- `search` — search title and description.
- `page` — page number.
- `pageSize` — number of tasks per page.

## Architecture and Engineering Decisions

### Backend structure

The backend separates responsibilities into:

- **Routes:** define API endpoints.
- **Controllers:** handle HTTP requests, validation, and responses.
- **Services:** contain business logic and database operations.
- **Validators:** validate incoming data using Zod.
- **Middleware:** handle errors consistently.
- **Prisma:** manages database access.

### Transactions and activity history

Task creation, updates, and deletion use database transactions so the task operation and its corresponding activity record succeed or fail together.

If an activity write fails, the related task operation is rolled back.

### Concurrency handling

The task model contains a `version` field.

When updating a task, the client sends the version it last received. The backend checks that version before applying the update and increments it after a successful update.

If another request has already changed the task, the backend returns a `409 Conflict` response instead of silently overwriting newer data.

### Database-side filtering and pagination

Filtering, searching, sorting, and pagination are performed through Prisma database queries rather than loading every task into application memory.

The current list order is newest first (`createdAt` descending).

## Running Tests

From the `server` directory:

```bash
npm test
```

The test suite uses Vitest and Supertest to test API behavior, validation, task operations, activity history, transaction rollback, and version conflicts.

## Assumptions and Limitations

- The application does not require user authentication.
- SQLite is used as the relational database.
- Tasks are sorted by creation date in descending order.
- The frontend currently connects to the local backend at `http://localhost:5000/api`.
- The application is intended as a small workflow-engine assignment, not a production multi-user deployment.

## Future Improvements

- Configurable sorting by different task fields.
- Reusable create and edit form components.
- More detailed frontend error handling.
- Configurable API base URL for deployment.
- Additional database and integration tests.

## AI Usage Disclosure

ChatGPT was used as an AI assistance tool during development for implementation guidance, code generation, debugging, and reviewing parts of the application.

The final implementation was tested and reviewed as part of the development process. I am responsible for understanding and explaining the submitted code and its design decisions.
