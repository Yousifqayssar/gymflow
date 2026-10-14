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
├── client/   # React frontend
├── server/   # Express REST API
└── docs/     # Diagrams and development log
```

## Getting started

### Prerequisites

- Node.js 20 or newer
- Docker Desktop

### 1. Start the database

```bash
cp .env.example .env        # then adjust the values if you want
docker compose up -d
```

### 2. Run the server

_Coming soon._

### 3. Run the client

_Coming soon._

## Running tests

_Coming soon._

## Screenshots

_Coming soon._
