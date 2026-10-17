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
│       ├── assets/classes/ # class category photos (Unsplash, see Photo credits)
│       ├── auth/           # AuthProvider + useAuth: who is logged in
│       ├── components/
│       │   ├── ui/         # design system: Button, Card, Modal, Toast, Avatar, …
│       │   └── classes/    # class cards, banners, booking panel, category picker
│       ├── pages/          # one component per page
│       └── utils/          # formatting (prices, dates, gym time zone)
├── server/                 # Express REST API
│   ├── prisma/             # database schema, migrations, admin seed and demo data
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
- `GYM_TIMEZONE` (default `Europe/Istanbul`): memberships start and end at midnight in this time zone.

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

### 5. Optional: demo data

To try the app with realistic data (and for presentations):

```bash
cd server
npm run db:seed:demo              # create or refresh the demo data (dates relative to today)
npm run db:seed:demo -- --remove  # remove all demo data again
```

It creates 4 membership plans, 2 trainers, 12 members in every membership situation (active, expiring soon, expired, upcoming, renewed, no membership) and about 25 classes for the next 14 days with bookings. All demo accounts end in `@demo.gymflow.local` and use the password `demo1234`, e.g. `elif@demo.gymflow.local` (member) or `mert@demo.gymflow.local` (trainer). Real accounts and data are never touched, and the script refuses to run when `NODE_ENV=production`.

## User roles

| Role | How the account is created | What they can do (so far) |
| --- | --- | --- |
| **Member** | Public sign-up, or created by an Admin on the People page | See their membership card and profile, browse classes, book and cancel spots |
| **Trainer** | Created by an Admin on the People page | Create, edit and cancel their own classes; see who booked them |
| **Admin** | Seed script (`npm run db:seed`) from `SEED_ADMIN_*` in `.env` | Everything: plans, people, memberships, all classes, the home overview |

Every user has a profile page with their member number (e.g. `GF-00004`).

## Membership rules

- A plan has a name, a duration in months (1–60) and a positive price. Plans are deactivated, never deleted once sold.
- A membership of _N_ months starting on a day _D_ ends the day before _D_ in month _N_ later (1 Oct → 31 Oct). If that day does not exist, it ends on the last day of that month (31 Jan → 28/29 Feb).
- Without a chosen start date, a new membership starts today, or the day after the member's current membership ends (renewal). Start dates in the past and overlapping memberships are rejected.
- The price is copied into the membership when it is sold.
- Status is calculated, not stored: **Active**, **Expiring soon** (ends within 7 days), **Expired**, **Upcoming**, **No membership**.

## Class and booking rules

- A class has a title, category, description, meeting point, start time, duration (15–300 min), capacity (> 0), level, intensity, and optional "what to bring" and health notes – everything a member needs before booking.
- Trainers create and manage only their own classes; admins manage all classes and choose the trainer.
- Classes must start in the future. A class that has started, or was cancelled, cannot be changed. Capacity cannot be lowered below the number of bookings. Cancelled classes stay visible.
- **Booking** (members only):
  - not beyond capacity (409),
  - not twice for the same class (409, also enforced by a unique index),
  - not after the class has started (400),
  - only with a membership valid on the day of the class, in the gym's time zone (403).
- Booking runs in a transaction with a row lock, so two members can never take the last spot at the same time.
- A booking can be cancelled until the class starts.

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
| `npm run db:seed:demo` | Create or refresh demo data (`-- --remove` to delete it) |
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

| Method | Path | Access | Description |
| ------ | ---- | ------ | ----------- |
| GET | `/api/health` | public | API and database status (200 ok / 503 error) |
| POST | `/api/auth/register` | public | Create a member account → `{ user, token }` |
| POST | `/api/auth/login` | public | Log in → `{ user, token }` |
| GET | `/api/auth/me` | logged in | The current user |
| GET | `/api/plans` | logged in | Membership plans (non-admins only see active ones) |
| POST | `/api/plans` | Admin | Create a plan |
| PATCH | `/api/plans/:id` | Admin | Edit or (de)activate a plan |
| GET | `/api/users?role=&status=&search=` | Admin | List users; members include their membership status and `counts` per status |
| POST | `/api/users` | Admin | Create a Member or Trainer account |
| GET | `/api/users/:id` | Admin | A member with status and membership history |
| GET | `/api/users/:id/memberships/preview?planId=&startDate=` | Admin | Calculated dates and price, without saving |
| POST | `/api/users/:id/memberships` | Admin | Assign a plan to a member |
| GET | `/api/me/membership` | Member | The logged-in member's own membership |
| GET | `/api/me/bookings` | Member | The member's upcoming booked classes |
| GET | `/api/classes?category=&from=&to=` | logged in | Class schedule (default: next 14 days) with spots left and "booked by me" |
| GET | `/api/classes/:id` | logged in | One class; its trainer and admins also get the list of booked members |
| POST | `/api/classes` | Admin, Trainer | Create a class |
| PATCH | `/api/classes/:id` | Admin, own Trainer | Edit a class |
| POST | `/api/classes/:id/cancel` | Admin, own Trainer | Cancel a class |
| POST | `/api/classes/:id/book` | Member | Book a spot |
| DELETE | `/api/classes/:id/book` | Member | Cancel the booking |

Status filters for `/api/users`: `active` (includes expiring soon), `expiring`, `expired`, `upcoming`, `none`. Prices are returned as exact strings, e.g. `"1500.00"`. Class times are exact moments with a time zone, e.g. `"2026-10-24T08:00:00+03:00"`.

Protected endpoints expect the header `Authorization: Bearer <token>`.

| Status | Meaning |
| --- | --- |
| 400 | Invalid input (`error.details` lists the fields) |
| 401 | Not logged in, or invalid/expired token, or wrong credentials |
| 403 | Logged in, but the role is not allowed |
| 404 | Not found (unknown plan, user or class) |
| 409 | Conflict, e.g. email already registered, plan name taken, overlapping membership, class full, already booked |

## Database design

See the [ER diagram](docs/diagrams/er-diagram.md).

## Screenshots

_Coming soon._

## Photo credits

The class category photos in `client/src/assets/classes/` are from [Unsplash](https://unsplash.com) and are used under the [Unsplash License](https://unsplash.com/license) (free to use, no permission needed). They are resized and stored in the project, so the app does not depend on an external website.

| Category | Unsplash photo |
| --- | --- |
| Running | [photo-1739368732843-800f36a9b7d0](https://images.unsplash.com/photo-1739368732843-800f36a9b7d0) |
| Yoga | [photo-1544367567-0f2fcb009e0b](https://images.unsplash.com/photo-1544367567-0f2fcb009e0b) |
| HIIT | [photo-1599058917212-d750089bc07e](https://images.unsplash.com/photo-1599058917212-d750089bc07e) |
| Cycling | [photo-1520877880798-5ee004e3f11e](https://images.unsplash.com/photo-1520877880798-5ee004e3f11e) |
| Pilates | [photo-1747238415033-b74eec07eb59](https://images.unsplash.com/photo-1747238415033-b74eec07eb59) |
| Boxing | [photo-1517438322307-e67111335449](https://images.unsplash.com/photo-1517438322307-e67111335449) |
| Strength | [photo-1641337221253-fdc7237f6b61](https://images.unsplash.com/photo-1641337221253-fdc7237f6b61) |
| Mobility | [photo-1607914660217-754fdd90041d](https://images.unsplash.com/photo-1607914660217-754fdd90041d) |

## Development log

See [docs/development-log.md](docs/development-log.md).
