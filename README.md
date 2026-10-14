# GymFlow

A web-based gym membership, class management and workout tracking system.

> Graduation project – Software Engineering, Altınbaş University.

## Features

- **Gym management:** authentication with roles (Admin, Trainer, Member), membership plans, membership expiry tracking, QR check-in, class scheduling and booking, admin dashboard.
- **Workout tracking:** exercise library, workout plans, workout logging, progress chart.

## Tech stack

| Layer    | Technology                                           |
| -------- | ---------------------------------------------------- |
| Frontend | React, Vite, Tailwind CSS, React Router, Recharts    |
| Backend  | Node.js, Express (REST API), Zod validation          |
| Database | PostgreSQL, Prisma ORM                               |
| Auth     | JWT, bcrypt                                          |
| Testing  | Vitest, Supertest, Playwright                        |
| Dev      | Docker Compose (PostgreSQL)                          |

## Project structure

```
gymFlow/
├── client/                 # React frontend (Vite + Tailwind)
│   └── src/
│       ├── api/            # functions that call the backend
│       └── components/     # reusable UI components
├── server/                 # Express REST API
│   ├── prisma/             # database schema and migrations
│   ├── src/
│   │   ├── config/         # environment variable validation
│   │   ├── routes/         # URL → controller mapping
│   │   ├── controllers/    # HTTP layer: read request, send response
│   │   ├── services/       # business logic
│   │   ├── lib/            # shared clients (Prisma)
│   │   └── middleware/     # 404 and error handling
│   └── tests/              # Vitest + Supertest tests
├── docs/                   # diagrams and development log
└── docker-compose.yml      # local PostgreSQL database
```

Request flow in the backend: **route → controller → service → Prisma (data access) → PostgreSQL**.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 22.18 or newer (developed with Node 24)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - On Windows, Docker Desktop needs **WSL 2**. If `wsl --install` fails, install the `.msi` from [github.com/microsoft/WSL/releases](https://github.com/microsoft/WSL/releases).

### 1. Configure environment variables

Two `.env` files are needed. Copy the examples and adjust the values:

```bash
cp .env.example .env                  # database settings for Docker
cp server/.env.example server/.env    # settings for the API
```

The username, password and database name in `server/.env` → `DATABASE_URL` must match the values in the root `.env`.

> `.env` files contain secrets and are ignored by git. Only the `.env.example` templates are committed.

### 2. Start the database

Make sure Docker Desktop is running, then:

```bash
docker compose up -d
docker compose ps        # gymflow-db should show "healthy"
```

### 3. Run the server (API)

```bash
cd server
npm install              # also generates the Prisma client
npm run dev              # http://localhost:4000
```

Check it: <http://localhost:4000/api/health> should return `"status": "ok"` and `"database": "up"`.

### 4. Run the client (website)

In a **second terminal**:

```bash
cd client
npm install
npm run dev              # http://localhost:5173
```

Open <http://localhost:5173>. The **System status** card should show API and Database as online.

## Available scripts

### Server (`server/`)

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Start the API and restart it when a file changes |
| `npm start`          | Start the API (no auto-restart)                  |
| `npm test`           | Run all tests once                               |
| `npm run test:watch` | Re-run tests on every file change                |
| `npm run db:migrate` | Create and apply database migrations             |
| `npm run db:studio`  | Open Prisma Studio to browse the database        |

### Client (`client/`)

| Command           | Description                                 |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Start the dev server with hot reload        |
| `npm run build`   | Build the production version into `dist/`   |
| `npm run preview` | Preview the production build                |
| `npm run lint`    | Check the code with Oxlint                  |

## Running tests

The database container must be running (`docker compose up -d`).

```bash
cd server
npm test
```

## API endpoints

| Method | Path          | Description                                  |
| ------ | ------------- | -------------------------------------------- |
| GET    | `/api/health` | API and database status (200 ok / 503 error) |

## Screenshots

_Coming soon._

## Development log

See [docs/development-log.md](docs/development-log.md).
