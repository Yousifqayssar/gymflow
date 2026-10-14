# GymFlow – Development Log

One entry per development stage: what was planned, what was built, which decisions were made, and which problems came up.

---

## Stage 0 – Setup

**Date:** 14 October 2026 (Week 1)

### Objective

Prepare the project foundation: repository structure, local database, a running Express API and a running React app, and prove that all parts can talk to each other.

### Implemented functionality

- Git repository with `/client`, `/server` and `/docs`, a `.gitignore` that keeps secrets and generated files out of git, and a README with setup instructions.
- PostgreSQL 16 running in Docker via `docker-compose.yml` (named volume for data, healthcheck with `pg_isready`).
- Express 5 API with a layered structure (routes → controllers → services → Prisma), environment variable validation with Zod, a 404 handler and a central error handler.
- Prisma 7 connected to PostgreSQL through the `@prisma/adapter-pg` driver adapter.
- `GET /api/health` endpoint that checks the database (`SELECT 1`) and returns 200 (`ok`) or 503 (`error`).
- First automated tests with Vitest and Supertest: 3 tests (healthy API, unknown route returns 404, database down returns 503 using a mocked service).
- React 19 app with Vite and Tailwind CSS v4, and a "System status" card that shows whether the API and database are online.
- Vite proxy from `/api` to the Express server.

### Technical decisions

| Decision | Reason |
| --- | --- |
| JavaScript (ES modules) instead of TypeScript | Easier to explain line by line; Zod gives runtime validation where it matters (user input). |
| Vitest for testing | One test tool for server and client, native ES module support, same syntax as Jest. |
| `app.js` separated from `server.js` | Supertest can test the app without starting a real server on a port. |
| Environment variables validated with Zod at startup | The server fails immediately with a clear message instead of crashing later. |
| Prisma 7 with the new `prisma-client` generator | Node 24 can run the generated TypeScript client directly, so no build step is needed and our own code stays JavaScript. |
| Generated Prisma client not committed | It can be recreated at any time; `postinstall` runs `prisma generate` automatically. |
| Exact versions for Prisma, React and Vite; only versions at least two weeks old | Avoids release candidates and brand-new releases that may still have bugs. |
| Mocking the health service in one test | The "database down" case can be tested without stopping Docker during the test run. |
| Vite proxy for `/api` | The browser only talks to one origin, so there are no CORS problems during development. |
| Oxlint in the client | Catches React mistakes early (it found an unnecessary re-render in the status component). |

### Problems encountered and solutions

1. **Docker Desktop could not start its engine ("WSL not installed").**
   *Cause:* On Windows 11 Home, Docker Desktop runs Linux containers through WSL 2, which was not installed.
   *Solution:* `wsl --install` failed with "Catastrophic failure"; installing the official WSL `.msi` from the Microsoft WSL GitHub releases page worked.

2. **npm installed a Prisma release candidate.**
   *Cause:* The `latest` tag of the `prisma` package pointed to `8.0.0-rc.22`, while `@prisma/client` was `7.10.0` (mismatched versions).
   *Solution:* Pinned `prisma`, `@prisma/client` and `@prisma/adapter-pg` to exactly `7.10.0`.

3. **`npm audit` reports 4 high-severity vulnerabilities.**
   *Cause:* All come from dependencies inside the Prisma CLI (`mysql2`, which we never use because we use PostgreSQL, and `deepmerge-ts`, which only processes our own config file).
   *Solution:* Not exploitable in this project. `npm audit fix --force` was not applied because it would install the Prisma 8 release candidate. To be re-checked when Prisma releases a stable fix.

4. **`prisma generate` failed when no `.env` file existed.**
   *Cause:* Prisma's `env()` helper throws if `DATABASE_URL` is missing, so `npm install` on a fresh clone would fail.
   *Solution:* Read the variable with `process.env.DATABASE_URL` in `prisma.config.js`.

5. **"Site can't be reached" / port already in use while testing locally.**
   *Cause:* The API was not running, or two copies of it were started on port 4000.
   *Solution:* Run each app with `npm run dev` from its own folder in its own terminal and keep it running.

### Related commits

- `chore: initialize repository with .gitignore and README skeleton`
- `chore: add docker-compose for PostgreSQL and env example`
- `feat(server): set up Express app with layered structure and health endpoint`
- `feat(server): configure Prisma and add database health check`
- `test(server): add Vitest and Supertest with health endpoint tests`
- `feat(client): scaffold React app with Vite and Tailwind`
- `feat(client): show API and database status from health endpoint`
- `docs: add Stage 0 entry to development log and update README`

### Next step

**Stage 1 – Prototype:** design the `User` model with roles (Admin, Trainer, Member), add the first Prisma migration, implement register and login with bcrypt and JWT, protect routes by role, set up a separate test database, and build a simple login page with React Router.

---

## Stage 1 – Prototype (Authentication and Roles)

**Date:** 15 October 2026 (Week 2)

### Objective

Let users create accounts and log in securely, make the server recognise who is calling and which role they have, and give the web application login, registration and protected pages.

### Implemented functionality

- `User` model with a `Role` enum (`ADMIN`, `TRAINER`, `MEMBER`) and the first database migration.
- Separate test database (`gymflow_test`) that is created and migrated automatically before the tests, with a safety check that refuses to run tests on any other database.
- `AppError` class, Zod request validation middleware with per-field error details, and clean 400 responses for malformed JSON.
- `POST /api/auth/register` (always creates a Member), `POST /api/auth/login`, `GET /api/auth/me`.
- Passwords hashed with bcrypt; login tokens are JWTs signed with HS256 and valid for 1 day.
- `authenticate` middleware (Bearer token → `req.user`, 401) and `authorize(...roles)` middleware (403).
- First admin-only endpoint: `GET /api/users`.
- Seed script that creates the first Admin from `.env` values (`npm run db:seed`).
- 25 new automated tests (35 in total), covering registration, login, tokens and role-based access.
- Frontend: API client that attaches the token, `AuthProvider` / `useAuth` for the logged-in user, React Router with login, register and a protected home page, route guards, and per-field form errors. Mobile-friendly layout.
- ER diagram of the current schema and of the planned data model (`docs/diagrams/er-diagram.md`).

### Technical decisions

| Decision | Reason |
| --- | --- |
| Public registration always creates a **Member** | If users could choose their role, anyone could register as Admin. Admins come from the seed script; Trainers will be created by Admins. Enforced twice: the Zod schema has no `role` field (it is stripped) and the service writes `MEMBER` explicitly. |
| `bcryptjs` instead of `bcrypt` | Same algorithm, pure JavaScript, no native compilation (which often fails on Windows). |
| JWT in the `Authorization: Bearer` header, stored in `localStorage` | Standard REST approach, simple to explain and test. Trade-off: readable by injected scripts (XSS); mitigated by React's automatic escaping and a 1-day expiry. httpOnly cookies would be more secure but add cookie/CORS complexity. |
| Token contains only user id and role; `authenticate` reloads the user from the database | A JWT payload is readable by anyone, so it holds no secrets. Reloading the user makes role changes and deleted accounts take effect immediately. |
| Only `HS256` accepted when verifying tokens | Prevents algorithm-switching attacks (e.g. `alg: none`). |
| Same error for unknown email and wrong password, and bcrypt always runs (dummy hash) | Prevents attackers from discovering which emails are registered, by message or by response time. |
| Emails trimmed and lower-cased | `Ali@Mail.com` and `ali@mail.com` are the same account. |
| Password length 8–72 | bcrypt ignores everything after 72 bytes. |
| Separate test database + `fileParallelism: false` | Tests delete data; they must never touch development data, and test files must not empty tables while another file uses them. |
| Seed uses `upsert` and reads credentials from `.env` | Idempotent (safe to run repeatedly) and no default password in the code or git history. |
| React Context split into 3 files (`AuthContext`, `AuthProvider`, `useAuth`) | Hot reload requires files that export only components; the linter enforces this. |
| Frontend route guards are for user experience only | The real protection is on the server; client-side code can always be bypassed. |

### Problems encountered and solutions

1. **Risk of an Admin sign-up hole.**
   *Problem:* The original requirement ("register with email and password, role-based access") would let a client send `role: "ADMIN"`.
   *Solution:* Members-only registration, enforced in validation and in the service, and covered by a test. Verified with mutation testing (see 5).

2. **Prisma 7 no longer regenerates the client after `migrate dev`.**
   *Solution:* The `db:migrate` script now runs `prisma migrate dev && prisma generate`.

3. **Tests would have deleted development data.**
   *Solution:* A separate `gymflow_test` database loaded from `.env.test`, automatic migrations before the tests, a safety check on the database name, and sequential test files.

4. **Old tokens kept old permissions.**
   *Problem:* A JWT keeps the role it was issued with for a whole day.
   *Solution:* `authenticate` loads the current user from the database on every request; tested by promoting a member and reusing the same token.

5. **Do the tests really catch bugs?**
   *Solution:* Two security bugs were inserted on purpose (a broken role check and registration accepting a role). Exactly the expected 3 tests failed; the code was then restored. This is called mutation testing.

6. **Linter warning about exports in the context file.**
   *Solution:* Split the auth context into three files.

7. **Development environment: PowerShell stuck at `>>` after pasting several lines.**
   *Cause:* Pasting multi-line commands left PowerShell waiting for an unfinished command.
   *Solution:* Press Ctrl + C and type commands one per line; use one terminal each for server, client and git.

### Tests

35 tests in 5 files, all passing (`npm test`):

| File | Tests | Covers |
| --- | --- | --- |
| `auth.test.js` | 20 | register, login, `/me`, tampered / foreign / expired tokens, deleted users |
| `users.test.js` | 5 | role-based access (401, 403 for Member and Trainer, 200 for Admin, live role changes) |
| `middleware.test.js` | 7 | validation, AppError status codes, malformed JSON |
| `health.test.js` | 2 | health endpoint, 404 |
| `health.database-down.test.js` | 1 | 503 when the database is down (mocked) |

### Related commits

- `feat(server): add User model with roles and first migration`
- `chore(server): add separate test database setup`
- `feat(server): add error and validation middleware`
- `feat(server): add register and login with bcrypt and JWT`
- `feat(server): add authentication and role authorization middleware`
- `feat(server): add admin seed script`
- `test(server): add auth and authorization tests`
- `feat(client): add API client and auth context`
- `feat(client): add routing with login, register and protected home page`
- `docs: add ER diagram and Stage 1 development log entry`

### Next step

**Stage 2 – Core functionality:** membership plans (Admin creates name, duration, price), assigning a plan to a member with automatic start and end dates, expiry logic (expiring within 7 days / expired), the Admin member list, and Admin-created Trainer accounts.
