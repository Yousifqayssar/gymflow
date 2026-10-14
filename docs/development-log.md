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
