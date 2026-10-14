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
│       ├── api/            # functions that call the backend (adds the login token)
│       ├── auth/           # AuthProvider + useAuth: who is logged in
│       ├── components/     # reusable UI components and route guards
│       ├── pages/          # one component per page (login, register, home)
│       └── utils/
├── server/                 # Express REST API
│   ├── prisma/             # database schema, migrations and seed script
│   ├── src/
│   │   ├── config/         # environment variable validation
│   │   ├── routes/         # URL → middleware → controller mapping
│   │   ├── controllers/    # HTTP layer: read request, send response
│   │   ├── services/       # business logic and business rules
│   │   ├── validation/     # Zod schemas for request bodies
│   │   ├── middleware/     # authentication, authorization, validation, errors
│   │   ├── utils/          # password hashing, JWT, AppError
│   │   └── lib/            # shared clients (Prisma)
│   └── tests/              # Vitest + Supertest tests (+ helpers and setup)
├── docs/                   # diagrams, development log, weekly reports
└── docker-compose.yml      # local PostgreSQL database
```

Request flow in the backend: **route → controller → service → Prisma (data access) → PostgreSQL**.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 22.18 or newer (developed with Node 24)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - On Windows, Docker Desktop needs **WSL 2**. If `wsl --install` fails, install the `.msi` from [github.com/microsoft/WSL/releases](https://github.com/microsoft/WSL/releases).

### 1. Configure environment variables

Three `.env` files are needed. Copy the examples and adjust the values:

```bash
cp .env.example .env                             # database settings for Docker
cp server/.env.example server/.env               # settings for the API
cp server/.env.test.example server/.env.test     # settings for the automated tests
```

- The username, password and database name in `DATABASE_URL` must match the values in the root `.env`.
- Set `JWT_SECRET` in `server/.env` to a long random value:
  `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
- Choose your own `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (the first Admin account).

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
npx prisma migrate deploy  # creates the database tables
npm run db:seed          # creates the first Admin account from .env
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

Open <http://localhost:5173>. You are sent to the login page: log in with the seeded admin account, or click **Create an account** to register as a member.

## User roles

| Role | How the account is created |
| --- | --- |
| **Member** | Public sign-up on the register page (always creates a Member) |
| **Admin** | Created by the seed script (`npm run db:seed`) from `SEED_ADMIN_*` in `.env` |
| **Trainer** | Created by an Admin (Stage 2) |

## Available scripts

### Server (`server/`)

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Start the API and restart it when a file changes |
| `npm start`          | Start the API (no auto-restart)                  |
| `npm test`           | Run all tests once                               |
| `npm run test:watch` | Re-run tests on every file change                |
| `npm run db:migrate` | Create and apply a migration after a schema change |
| `npm run db:seed`    | Create the first Admin account                   |
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
npm test                                # all tests
npx vitest run --reporter=verbose       # list every test by name
```

Tests use a **separate database** (`gymflow_test`, configured in `server/.env.test`). It is created and migrated automatically, and its tables are emptied before each test. As a safety check, tests refuse to run if the database name does not end in `_test`.

## API endpoints

| Method | Path                 | Access     | Description                                   |
| ------ | -------------------- | ---------- | --------------------------------------------- |
| GET    | `/api/health`        | public     | API and database status (200 ok / 503 error)  |
| POST   | `/api/auth/register` | public     | Create a member account → `{ user, token }`   |
| POST   | `/api/auth/login`    | public     | Log in → `{ user, token }`                    |
| GET    | `/api/auth/me`       | logged in  | The current user                              |
| GET    | `/api/users`         | Admin only | List all users                                |

Protected endpoints expect the header `Authorization: Bearer <token>`.

| Status | Meaning |
| --- | --- |
| 400 | Invalid input (`error.details` lists the fields) |
| 401 | Not logged in, or invalid/expired token, or wrong credentials |
| 403 | Logged in, but the role is not allowed |
| 409 | Conflict, e.g. email already registered |

## Database design

See the [ER diagram](docs/diagrams/er-diagram.md).

## Screenshots

_Coming soon._

## Development log

See [docs/development-log.md](docs/development-log.md).
