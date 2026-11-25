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

---

## Stage 2 – Core Functionality (Memberships)

**Date:** 16 October 2026 (Week 3)

### Objective

Let the Admin define membership plans, create accounts, sell plans to members with automatically calculated dates, and see at a glance whose membership is active, expiring within 7 days or expired. Members see their own membership.

### Implemented functionality

- `MembershipPlan` and `Membership` tables (second migration) with database **check constraints**: positive duration and price, end date after start date.
- Date helpers: "today" in the gym's time zone (`GYM_TIMEZONE`), end-date calculation with correct month-end and leap-year handling.
- Membership status calculated from the dates: Active, Expiring soon (≤ 7 days), Expired, Upcoming, No membership.
- Plans API and page: create, edit, deactivate/activate (Admin); members only see active plans.
- Admin creates Member and Trainer accounts; People page with Members/Trainers tabs and search.
- Assigning a plan: automatic start date (today or the day after the current membership ends), optional future start date, no back-dating, no overlaps, price copied from the plan; live preview of the dates calculated by the server.
- Member detail page with current status and membership history.
- Member list with status badges, days left, filter chips with counts (All, Active, Expiring soon, Expired, No membership); "Expiring soon" sorted by urgency.
- `GET /api/me/membership` and a "My membership" card on the member's home page.
- App layout with a role-based menu; role-restricted pages in the router.

### Technical decisions

| Decision | Reason |
| --- | --- |
| Build in vertical slices (API + tests + page per feature) | Each step can be seen and tried in the browser; changed after steps 1–3 were backend-only. |
| Status calculated, not stored | Always correct without a nightly job; one tested function used by the list, the detail page and the member card. |
| Dates stored as `DATE`, handled as midnight UTC; "today" taken in `Europe/Istanbul` | Memberships expire at gym midnight, wherever the server runs; daylight saving time cannot shift dates. |
| End-date rule with month-end clamping | "31 Jan + 1 month" does not exist; it ends on 28/29 Feb. Tested for every day of a leap year × 4 plan lengths. |
| Renewals start the day after the current membership ends | Members never lose paid days. |
| Overlap check + `SELECT … FOR UPDATE` row lock in a transaction | Prevents two simultaneous requests (e.g. a double click) from creating overlapping memberships. |
| Money as `DECIMAL(10,2)`, sent as strings (`"1500.00"`) | Floating-point numbers cannot represent money exactly. |
| Price copied into each membership | Later price changes do not rewrite past sales. |
| Plans deactivated instead of deleted; foreign key `RESTRICT` | Sold plans must stay in the history. |
| Database CHECK constraints in addition to Zod | Defence in depth: invalid data is rejected even if the API is bypassed. |
| Server-side date preview | The browser shows exactly what the server will save; date rules exist in one place only. |
| `/api/me/membership` without an id in the URL | Prevents IDOR: a member cannot change an id to read another member's data. |
| Admins can create Members and Trainers, not Admins | The most powerful role stays limited to the seed script. |
| Status filtering in JavaScript instead of SQL | Reuses the tested status functions; fast enough for a gym. SQL filtering would scale better for very large data sets. |

### Problems encountered and solutions

1. **Changes were not visible in the browser.**
   *Cause:* The original plan built all API endpoints first and the pages at the end.
   *Solution:* Switched to vertical slices; every later step ended with a working page.

2. **"31 January + 1 month" has no matching day.**
   *Solution:* If the start day does not exist in the target month, the membership ends on that month's last day; covered by unit tests including leap years.

3. **Race condition when assigning memberships.**
   *Problem:* Two requests at the same time could both pass the overlap check.
   *Solution:* A transaction that locks the member's row. A test sends two requests at once; with the lock removed it failed 5 out of 5 times, with the lock it passes.

4. **Prisma cannot express CHECK constraints.**
   *Solution:* Generated the migration with `--create-only` and added the constraints to the SQL by hand. During a later manual test, the constraint rejected a demo membership whose end date was before its start date.

5. **Calendar dates shown one day early in time zones west of UTC.**
   *Solution:* The client formats `YYYY-MM-DD` dates in UTC.

6. **Inconsistent row layouts on phones.**
   *Solution:* Rows always stack the same way on small screens (checked with screenshots at phone width).

7. **"Cannot reach the server" in the browser.**
   *Cause:* The server and client windows had been closed.
   *Solution:* Keep the two windows open (minimised) while using the app.

### Tests

130 tests in 11 files, all passing (95 new in this stage):

| File | Tests | Covers |
| --- | --- | --- |
| `unit/dates.test.js` | 10 | end dates (month end, leap year, 12 months, 1,464 combinations), time zone, DST |
| `unit/membershipStatus.test.js` | 13 | every status, the exact 7-day boundary, choosing the current membership |
| `plans.test.js` | 23 | validation, duplicate names, permissions, inactive plans, database constraints |
| `memberships.test.js` | 21 | date calculation, renewal, overlaps, concurrency, price copy, preview |
| `member-list.test.js` | 12 | statuses, counts, filters, urgency sorting |
| `my-membership.test.js` | 5 | own data only, permissions |
| `users.test.js` | 16 (+11) | account creation by admins, role and search filters |

The clock is frozen in tests (`vi.useFakeTimers({ toFake: ['Date'] })`) so "today" is always 15 October 2026.

### Related commits

- `feat(server): add membership plan and membership models`
- `feat(server): add date and membership status helpers`
- `feat(server): add membership plan endpoints`
- `feat(client): add app layout with role-based navigation`
- `feat(client): add membership plans page`
- `feat: add admin account creation and people page`
- `feat: add membership assignment with date preview and member detail page`
- `feat: add membership status, expiry filters and counts to member list`
- `feat: show own membership to members`
- `docs: add Stage 2 development log, ER diagram update and week 3 report`

### Next step

**Stage 3a – QR check-in:** each member gets a personal QR code (a random token, not their id); staff scan it or type the code to record a check-in; members with an expired or no membership cannot check in.

---

## Week 4 – Demo Data, UI Redesign and Stage 3b (Classes and Booking)

**Date:** 17 October 2026 (Week 4)

### Objective

Make the application look and feel professional, give every user a profile, provide realistic demo data for testing and presentations, and implement group classes with full information and booking (Stage 3b). Stage 3b was done before Stage 3a (QR check-in) because classes and booking were the higher priority; QR check-in and the new loyalty points follow next week.

### Implemented functionality

- **Demo data** (`npm run db:seed:demo`): 4 plans with descriptions, 2 trainers, 12 members in every membership situation and about 25 classes over the next 14 days with bookings. Dates are relative to today; real data is never touched; refuses to run in production.
- **Design system:** emerald brand colour as Tailwind tokens, Inter font (bundled), lucide icons, reusable components (Button, Card, PageHeader, StatCard, Avatar, EmptyState, Modal, Toast, Logo).
- **Layout:** top navigation on desktop, slide-in menu on phones (chosen by the user over a sidebar).
- **Redesigned pages:** split-screen login/register, admin home with stat cards and "needs renewal", member home with a membership card (progress bar, blue "starts in" card for upcoming memberships).
- **Profile page** for every user with member number (`GF-00004`), member since and a points card (points arrive with check-ins).
- **Plan descriptions** ("what's included"), shown in the plan list and when selling a plan.
- **Classes:** `GymClass` and `Booking` tables; class API for admins and trainers; schedule grouped by day with category filter; class detail page with description, meeting point, time, level, intensity, what to bring and health notes; create/edit form with photo category picker and live preview; cancel class.
- **Photos:** one Unsplash photo per category, tinted in the category colour, on cards and banners.
- **Booking:** book and cancel with all business rules; booking panel (bottom bar on phones); "My next classes" on the member home.

### Technical decisions

| Decision | Reason |
| --- | --- |
| Demo data as a tested script, identified by the email domain `@demo.gymflow.local` | Reproducible for anyone (including the supervisor); re-running refreshes dates; real data is safe; tested. |
| Design tokens (`brand-*`) in one CSS file | The whole colour scheme can be changed in one place. |
| Fonts and photos bundled in the app | No requests to Google or Unsplash at runtime: privacy and offline use. |
| Native `<dialog>` for modals | Built-in focus handling, Escape key and accessibility. |
| `startsAt` as `TIMESTAMPTZ`, shown in the gym's time zone | A class starts at an exact moment; members abroad still see the gym's local time. |
| Category enums (`ClassCategory`, `ClassLevel`, `ClassIntensity`) | Only known values can be stored. |
| Unique index on `(classId, memberId)` + CHECK constraints | Double booking, zero capacity and absurd durations are impossible even outside the API. |
| Booking in a transaction with `SELECT … FOR UPDATE` on the class | Prevents overbooking when many members book the last spots at the same time. |
| Membership must be valid on the **class day** (gym time zone) | Booking a class without a membership that day makes no sense; 23:30 vs 00:30 is handled correctly. |
| Booked-member list only for the class's trainer and admins | Privacy; the server decides, the page only shows what it receives. |
| Cancel classes instead of deleting them | Booked members can see what happened. |
| Server sends `daysUntilStart`, `spotsLeft`, `isBookedByMe` | Pages stay simple and never need their own clock or counting. |

### Problems encountered and solutions

1. **The interface looked too basic.** *Solution:* a design system and a full redesign, with the user choosing layout and colour.
2. **Class icons looked plain.** *Solution:* real activity photos (Unsplash licence, credits in the README), tinted per category, with a dark fade for readable text.
3. **No visible booking for members.** *Cause:* booking was planned after the trainer form. *Solution:* re-ordered so members could book first.
4. **A concurrency test that could not fail.** With two members and one spot, the test passed with and without the row lock. *Solution:* six members for the last two spots; without the lock it failed 5/5 times, with the lock it passed 5/5 times.
5. **Demo data removal blocked by `RESTRICT`.** A trainer with classes cannot be deleted. *Solution:* demo classes are removed before demo trainers; covered by a test.
6. **Lint: impure `new Date()` during rendering.** *Solution:* values that depend on the clock are computed once (module level) or when data is loaded, never while rendering.
7. **Confusing "membership hasn't started yet".** *Cause:* old test data with a start date in the future. *Solution:* cleaned the test data; the card now shows "Starts in N days" in blue with the start date.

### Tests

197 tests in 15 files, all passing (67 new this week). New files: `classes-database.test.js` (8, database rules), `classes.test.js` (26, class API and permissions), `bookings.test.js` (18, every booking rule, time-zone boundary and concurrency), plus additions to `demo-data.test.js` (11), `plans.test.js` and `memberships.test.js`.

### Related commits

`feat(server): add demo data seed script` · `feat(client): add design system with brand theme, icons and base components` · `feat(client): add sidebar layout with mobile bottom navigation` · `feat(client): add top navigation with mobile slide-in menu` · `feat(client): redesign login and register pages` · `feat(client): add profile page with member number and points card` · `feat(client): redesign home pages with admin overview and membership card` · `feat: add descriptions to membership plans` · `feat(server): add class and booking models` · `feat(server): add class endpoints for admins and trainers` · `feat(client): add class schedule and class detail pages` · `feat(server): add demo classes to the demo data` · `feat(client): add category photos to class cards and banners` · `feat(server): add class booking with capacity and timing rules` · `feat(client): add booking and cancelling classes` · `feat(client): add create and edit class form` · `feat: show when an upcoming membership starts` · `docs: add week 4 development log, documentation and report`

### Next step

**Stage 3a – QR check-in and loyalty points:** a personal QR code per member (random token), staff scan or type it to record a check-in, members without a valid membership cannot check in, +10 points per visit (once per day) with Bronze/Silver/Gold levels.
---

## Week 5 – Stage 3a + 3c, Payments, Membership Types and the Web App

**Date:** 17–20 October 2026 (Week 5)

### Objective

Planned: Stage 3a – QR check-in and loyalty points. Stage 3a was finished early, so Stage 3c (exercises, workout plans, logging, progress), planned for Week 6, was done too. While testing the app on a phone, it became clear that a real gym also needs payments, attendance and different membership types, so these were added this week. Finally, the phone layout was rebuilt as an app and the whole system was deployed online.

### Implemented functionality

- **QR check-in (Stage 3a):** personal QR code per member (random token, resettable); staff check-in page with camera scanner or member number; members without a valid membership are refused with a clear reason; today's check-ins on the admin and trainer home.
- **Loyalty points and rewards:** +10 points per visit (once per day), −10 per missed class; levels Bronze, Silver (100), Gold (300), Platinum (600) with 0/5/10/15 % off every new membership; Rewards page.
- **Design:** display font, dark mode on every page, page and number animations (off for reduced motion), 3D dumbbell on the login page, avatar picker, redesigned home, profile and class schedule; contrast, tap-target and screen-reader fixes.
- **Health and extras:** monthly body check-ins (height, weight, goal, BMI, weight chart, reminder); partner gyms on a map with opening hours (admin Locations page); food photo analysis with Google Gemini (calories and macros).
- **Workouts (Stage 3c):** exercise library (32 exercises, muscle groups, equipment, 3D demos); trainers write workout plans with days, sets, reps, weight and rest; live workout session with rest timer; progress page with weekly stats, exercise charts and personal bests.
- **Online card payments:** membership checkout with a card preview, test gateway and receipts; declined attempts are saved; admin Payments page with revenue totals and filters; payments on each member's page.
- **Class attendance QR:** trainer shows a QR code that changes every 30 s (from 15 min before the start); members scan it; live list with manual marking; booked members who do not come lose 10 points.
- **Basic and Premium memberships:** `classesPerMonth` on plans (0 = Basic, 10 = Premium), balance per membership month, unused classes lost at the reset; balance card on the Classes and Membership pages.
- **Paying per class:** every class has a price; Basic members pay it, Premium members with no classes left pay it −30 %; "Book & pay" with the card form; refunds when the member or the trainer cancels.
- **Web app:** bottom tab bar per role on phones and tablets, "More" sheet, footer only on desktop; installable Progressive Web App (manifest, icons, service worker without caching).
- **Deployment:** one Render web service serves the API and the built website; Neon PostgreSQL; migrations run on every deploy; demo data can be refreshed online.

### Technical decisions

| Decision | Reason |
| --- | --- |
| QR code holds a random token, not the member id | Cannot be guessed; can be reset if it was shared. |
| Unique index on `(memberId, gymDay)` for check-ins | Points can be earned only once per day, even if two staff scan at once. |
| Points calculated from visits and missed classes, never stored | They can never get out of sync. |
| Attendance code changes every 30 s; the server sends its own time | A shared photo stops working; a wrong tablet clock does not break the countdown. |
| No-show penalty only when the trainer opened the attendance screen | Members are not punished when attendance was never taken. |
| Card number and CVC never stored; unique `checkoutId` | Privacy; a double click never charges twice. |
| Price, discount and `classesPerMonth` copied onto each membership | Editing a plan later never changes what members already bought. |
| Class balance per membership month, counted from bookings | Fair for members who join late in a month; nothing to keep in sync. |
| Booking locks the class row **and** the member row | No overbooking, and two quick bookings cannot both use the last included class. |
| Card charged only after every booking rule passed, in the same transaction | A member is never charged for a class they cannot get. |
| Food photos analysed on the server | The Gemini API key never reaches the browser. |
| Progressive Web App instead of native apps | One code base for every device, installable without an app store. |
| Service worker without offline cache | Bookings, balances and payments must always be live. |
| One Render service for API and website | One address, no CORS configuration, free hosting. |

### Problems encountered and solutions

1. **QR scanner did not start on some laptops.** *Cause:* the scanner library demanded a camera height of at least 640 px, which 480p webcams cannot give. *Solution:* the picture size is now a wish (`ideal`), not a requirement.
2. **Users always landed on the home page after logging in.** *Cause:* the login page and the guest route redirected at the same moment. *Solution:* both send the user to the page they asked for, including its query, so a member who scans a class QR while logged out comes back to the check-in.
3. **Payments page crashed after the first class payment.** *Cause:* the payment list expected every payment to have a plan. *Solution:* payment lists show plans, classes and refunds; found in local testing before deployment.
4. **A test failed only because time moved.** *Cause:* moving the fake clock one month ahead made the test user's token expire. *Solution:* create the user after moving the clock.
5. **Dev server stopped after schema changes.** *Cause:* on Windows, `prisma generate` locks the client files of the running server. *Solution:* restart the server after each migration.
6. **Slow first load online.** *Cause:* the free Render plan sleeps after 15 minutes. *Solution:* open the site a minute before demonstrations.

### Tests

458 tests in 35 files, all passing (261 new this week). New files: `check-ins.test.js` (24) and `check-ins-database.test.js` (8), `me-qr-visits.test.js` (11), `account-avatar.test.js` (11), `gym-stats.test.js` (4), `body.test.js` (19), `partner-gyms.test.js` (13), `nutrition.test.js` (13, AI mocked), `exercises.test.js` (13), `workout-plans.test.js` (16), `workout-logs.test.js` (11), `progress.test.js` (4), `payments.test.js` (18), `attendance.test.js` (20), `class-balance.test.js` (14), `class-payments.test.js` (15), and unit tests `points` (4), `progress` (9), `cardGateway` (7), `serveClient` (4); `demo-data.test.js` grew to 26.

### Related commits

55 commits, from `feat(server): add QR token and check-in model` to `feat(client): book and pay for single classes with refunds on cancel` (full list in the Week 5 report), plus `docs: add week 5 development log and report`.

### Next step

**Stage 4 – tests, validation and security:** review inputs and permissions, rate-limit login, add client-side tests for booking, checkout and check-in, and test the installed app on real phones.

---

## Week 6 – Stage 4: Testing, Validation and Security

**Date:** 22 October 2026 (Week 6)

### Objective

Make GymFlow secure and prove with tests that it works: security headers, a limit on login attempts, a protection check for every endpoint, a dependency audit, screen tests and end-to-end tests. During the week the student tested the live site and reported three problems, which were fixed the same day.

### Implemented functionality

- **Security headers** (helmet): strict Content Security Policy (own code only, plus OpenStreetMap tiles), no framing, HSTS, nosniff. The dark-mode script moved into `public/theme-init.js`; the service worker ignores requests to other websites.
- **Login rate limit** (express-rate-limit): 10 failed login/register attempts per 15 minutes per address; successful logins are not counted; `trust proxy` online.
- **Route protection test:** discovers all 60 endpoints from `app.js` and the routers; 57 × no token (401), 57 × forged token (401), 78 × wrong role (403). `authorize()` exposes its allowed roles for this.
- **Dependency audit:** prisma 7.10.0 → 7.10.1, vite 8.3.1 → 8.3.4; `npm audit` 0 everywhere.
- **Screen tests** (client): Vitest + React Testing Library + jsdom; booking panel, card form, check-in page, API helper, helper functions.
- **End-to-end tests** (`e2e/`): Playwright with the installed Chrome; own database `gymflow_e2e` with fresh demo data; server in production mode on port 4300; 9 user journeys on desktop and phone.
- **Food scanner:** 30-second budget (main model 15 s → fallback model → 2 s pause → fallback again), no hidden SDK retries, timer + Cancel + “Try again”, calm “scanner is busy” card, 768 px uploads.
- **Error handler:** messages written for users (AppError) are always shown, also for 5xx; only unexpected errors are hidden behind a friendly sentence.
- **Partner gyms in Premium:** `CheckIn.partnerGymId`; Basic members refused at partner gyms (`PARTNER_GYM_PREMIUM_ONLY`); “Checking in at” picker; map with access banner, my location, distances, nearest open gym, filters, Directions and Call; visits per gym.
- **Expired login:** a 401 during a session clears the login and shows “Your session has ended. Please log in again.”, then returns to the same page.

### Technical decisions

| Decision | Reason |
| --- | --- |
| Strict CSP without inline scripts | Injected scripts cannot run. |
| Count only failed login attempts | Stops guessing without blocking normal members. |
| Discover endpoints automatically in the protection test | New endpoints are checked without updating a list. |
| Separate `gymflow_e2e` database, production build | Predictable data; tests what is really deployed. |
| Fixed time budget + fallback model for Gemini | A member never waits minutes. |
| Show AppError messages, hide only unexpected errors | Useful messages without leaking internals. |
| Partner gyms as a Premium benefit, checked by the server | One clear rule, visible on the map. |

### Problems encountered and solutions

1. **Map tiles blocked by the new CSP.** *Cause:* the service worker re-fetched OpenStreetMap tiles. *Solution:* it ignores other websites; found by opening every page of the production build.
2. **Food scanner took 195 s.** *Cause:* the Gemini library retried 5 times while the model was overloaded. *Solution:* no hidden retries, 30-second budget, fallback model.
3. **“Internal server error” instead of the friendly message.** *Cause:* the production error handler hid all 5xx messages. *Solution:* only unexpected errors are hidden.
4. **Changes not visible online.** *Cause:* not pushed yet. *Solution:* push; Render needs a few minutes.
5. **“Invalid or expired token” after refreshing demo data.** *Cause:* demo accounts are recreated with new ids. *Solution:* polite logout and return to the same page.
6. **Nearest-gym line split into columns on phones.** *Solution:* normal text flow.

### Tests

675 API tests (39 files), 29 screen tests (5 files), 9 end-to-end tests – all passing. New: `security.test.js`, `route-protection.test.js`, `partner-gym-access.test.js`, `unit/errorHandler.test.js`, more nutrition tests; client `BookingPanel`, `CardCheckout`, `CheckInPage`, `api/client`, `utils/helpers` tests; e2e `login`, `booking`, `check-in`, `phone` specs. Mutation checks confirmed that the new tests fail when the protection is switched off.

### Related commits

`feat(server): add security headers and rate limit login attempts` · `test(server): check every endpoint for login and role protection` · `chore: update prisma and vite to fix audit warnings` · `test(client): add screen tests for booking, checkout and check-in` · `test: add Playwright end-to-end tests for the main user flows` · `fix: food scanner time limit, fallback model and readable error messages` · `feat: make partner gyms part of Premium with location-aware map and check-in` · `fix(client): log out politely when a saved login stops working` · `docs: add week 6 development log and report`

### Next step

**Stage 5 – user testing and polish:** real-phone test (S6 checklist), short sessions with a member, a trainer and an admin, then fixes and dashboard improvements.

---

## Week 7 – Stage 5: Polish, Admin Dashboard and Accessibility

**Date:** 18 November 2026 (Week 7)

### Objective

Polish GymFlow for real users: a public front page for visitors, a dashboard that shows the admin how the gym is doing, and an accessibility and performance check. Problems found on the live site during the week were fixed along the way.

### Implemented functionality

- **Public landing page** (`/welcome`): visitors who are not logged in now see a front page instead of the login form. Large condensed headline over a gym photo, three steps from sign-up to first workout, the QR membership card, Basic vs Premium plans (₺1,000 / ₺1,500), the partner gyms in Istanbul, and a closing call to action. Logged-out visits to `/` go to `/welcome`; logged-in users are sent into the app.
- **Map tiles fixed online:** OpenStreetMap refused the tiles ("403 Access blocked") because the site sent no `Referer`. The security headers now use `strict-origin-when-cross-origin`, and the tiles come from the single `tile.openstreetmap.org` address.
- **Admin dashboard – "gym health"**: a new admin-only endpoint `GET /api/gym/admin-dashboard` and two new cards on the admin home page:
  - **Revenue:** paid payments (memberships and single classes) per month for the last 6 months, as a bar chart with this month's total on top. Declined and refunded payments are not counted.
  - **Class attendance:** the share of booked members who actually came in the last 30 days, with attended, no-shows and number of classes. Only classes where the trainer took attendance are counted, so members are not wrongly marked as no-shows.
- **Accessibility:** a "Skip to main content" link that appears on the first Tab key press, so keyboard users can jump past the menu (WCAG 2.4.1).
- **Performance:** the 8 class photos were converted from JPG to WebP (1,015 kB → 520 kB, about half), and the small class pictures further down the page load only when the user scrolls to them (`loading="lazy"`).

### Technical decisions

| Decision | Reason |
| --- | --- |
| Hand-drawn bar chart instead of a chart library | Matches the existing charts and adds nothing to the download. |
| Count attendance only for classes where attendance was taken | A class without an attendance check would show everyone as a no-show. |
| Revenue grouped by the gym's month (Istanbul time) | A payment at 01:00 on the 1st belongs to the new month, as the admin expects. |
| Dashboard endpoint for admins only | Revenue is business information; trainers get 403. |
| Check accessibility by reading the components | An automatic in-browser scanner could not be run here; reading the code also shows exactly what to change. |
| WebP at quality 80 with the `cwebp` tool already on the machine | Half the size with no visible difference, and no new package. |

### Problems encountered and solutions

1. **Map still blocked after the first fix.** *Cause:* the helmet default `Referrer-Policy: no-referrer`; OpenStreetMap requires a `Referer`. *Solution:* `strict-origin-when-cross-origin`; a hard refresh (Ctrl+Shift+R) was needed to see it.
2. **Classes page online said "No classes planned".** *Cause:* not a bug – demo classes are created only for the 14 days after the demo data is loaded, and that period had passed. *Solution:* reloaded the online demo data; this must be repeated before each presentation.
3. **Screen tests sometimes did not start ("Vitest failed to find the current suite").** *Cause:* it happened only when the tests were started from Git Bash, which names the folder `d:\` instead of `D:\`, so the test library can be loaded twice. *Solution:* run the tests from PowerShell, where all of them run every time.
4. **The development server (port 5173) kept dropping during screenshots.** *Solution:* built the app and ran it in production mode on port 4300, as for the end-to-end tests.
5. **Check-in ignored a second typed number.** Found when the end-to-end tests ran just after midnight. *Cause:* the page ignores the same code for 10 seconds – right for the camera, which reads one QR code many times a second, but it also blocked numbers typed by hand. The test had passed before only because the demo data usually already had a visit for that member today. *Solution:* the 10-second rule applies only to the camera.
6. **Front page said "6 partner gyms".** GymFlow has its own gym plus 5 partner gyms; the Premium card now says 5.

### Tests

685 API tests (40 files), 33 screen tests (6 files), 12 end-to-end tests. New: `gym-admin-dashboard.test.js` (revenue per month, ignored payment states, attendance rate, excluded classes, empty case, admin-only access), `MonthlyRevenueBars.test.jsx` (chart label, screen-reader table, current month value), two `CheckInPage` tests (a typed number is sent again; the same QR code from the camera is not), e2e `landing.spec.js` (front page, Join and Log in buttons, logged-in redirect). The skip link and the WebP images were checked in the production build.

### Related commits

`fix: let OpenStreetMap see the site address so map tiles load` · `feat(client): add public landing page at /welcome` · `feat: add gym-health dashboard with monthly revenue and class attendance` · `perf(client): add skip link and convert class photos to WebP` · `docs: add week 7 development log` · `docs: add user-testing script for stage 5` · `fix(client): answer a second typed check-in and show 5 partner gyms` · `docs: add week 7 report`

### Reproducibility, installation and integration (23 November)

- **Fresh install from GitHub:** the project was cloned into an empty folder and installed using only the README, with a new empty database (port 5433 and a renamed container, because the developer's own database already uses 5432). All 14 steps worked in about 2 minutes of commands, and the fresh copy passed 685 API, 33 screen and 12 end-to-end tests. Results: `docs/reports/evidence/week-07-fresh-install.json`.
- **README rewritten:** the install showed it still described the first stages. Now it lists every feature, all 61 API endpoints with roles, status codes 402/429, the error shape, test cards, the demo accounts, a "check that everything works" table, deployment (Render + Neon) and troubleshooting, plus two screenshots of the fresh install.
- **Lint warning fixed:** `client/public/theme-init.js` no longer keeps an unused error variable (0 warnings).
- **Package advisories:** `npm audit fix` (without `--force`) updated body-parser 2.3.0 → 2.4.0, qs 6.16.0 → 6.17.1 and fast-uri 3.1.8 → 3.1.9 in the server lock file; 685 API and 12 end-to-end tests pass. One advisory remains: `effect`, pinned to 3.20.0 by the Prisma command-line tool (also in the newest Prisma 7). It runs only during builds and never sees user input; `--force` would downgrade Prisma to 6, so we wait for a Prisma update.
- **Week 7 report** written for the topic "Reproducibility, Installation and Integration" (`docs/reports/week-07-report.docx`).
- **25 November – Week 7 report rebuilt to the official university guide** (received 25 Nov): the six tasks, one complete use case traced through all components (a member books a class), dependencies with the tested versions, installation procedure with real expected output, the guide's R01–R06 reproducibility table, corrections C1–C5 with commit links, the Stage 5 record, answers to the eight questions, the submission checklist and references. The Git history (127 commits) was searched for secrets: only placeholders were ever committed. A peer installation sheet was added (`docs/user-testing/peer-install-sheet.md`) for the planned peer test.

### Next step

**Stage 5, continued – user testing:** a short test script for real people (a member, a trainer, an admin) on their phones, collect their feedback, and fix what they find.

## Week 8 – Stage 5: Front Page Polish

**Date:** 24 November 2026 (Week 8)

### Objective

Polish the public front page (`/welcome`) that visitors see before they log in or join, so it shows the real product and answers the first questions of a new member.

### Implemented functionality

- **Real app in the hero:** the member home screen on a phone next to the headline, and three short facts (opening hours, 8 kinds of classes, 6 gyms with one QR code). The hero photo is brighter, so the gym is visible.
- **Classes section:** the 8 class types with their real photos.
- **"Everything after the door is in the app too":** real screens of workout plans, progress, food scanner and rewards, with one sentence each.
- **Partner gyms as a map:** a simple drawing of Istanbul with the Bosphorus; our gym in Kadıköy and the 5 partner gyms on the correct side.
- **FAQ:** five questions answered as the app really works (no automatic renewal, Basic pays per class, cancelling a class, payment, no card needed). Built with native `<details>`, so it works with the keyboard and screen readers.
- **Plans:** the made-up perk "free intro session with a trainer" was removed (GymFlow has no such feature); Basic now says "Book any class and pay per class", Premium "Extra classes 30% cheaper".
- **Spacing and sections:** light-mode sections now alternate white and light grey (before, both colours were the same `slate-50`); less empty space between sections; phone layout shows classes and app screens two per row.

### Problems encountered and solutions

1. **"Join GymFlow" unreadable in dark mode** (white text on white, contrast 1.23:1). *Cause:* the button combined the `secondary` variant with `bg-white text-brand-800`; two Tailwind classes for the same property do not override each other by their order in the list, so dark mode used the variant's light text colour. *Solution:* buttons on dark and green backgrounds have their own complete class lists.
2. **No way back from the login and join pages.** *Found by:* the developer, while clicking through the site. *Solution:* on both pages the GymFlow logo and a new "Back to the front page" link ("Back" on phones) lead to `/welcome`.
3. **The page became twice as long on phones** after the first version. *Solution:* two columns for the app screens and a smaller hero phone (8,949 px instead of 10,746 px).

### Smooth scrolling and scroll animations (24 November)

The user found scrolling the front page not smooth and asked for content that appears while scrolling. Every step was measured: the whole page scrolled in Chrome with the processor slowed down 4× (like a phone), counting frames slower than 20 ms.

| Version | Slow frames, fast scroll (desktop / phone) |
| --- | --- |
| Before (no animations) | 1.0% / 0.1% |
| Animations with the Motion library (JavaScript every frame) | 24.6% / 20.1% |
| CSS transitions started by an IntersectionObserver | 11.5% / 8.3% |
| … class added directly, without a React update | 8.8% / – |
| … 15 blocks appear instead of 29 single items (final) | 5.4% / 2.7% |
| Final, at normal reading speed | 4.3% / 1.7% |

- **Cheaper drawing for every scroll:** the menu bar no longer blurs what is behind it (a blur has to be recalculated every frame), and the hero photo is saved 50% brighter instead of being brightened by a CSS filter.
- **Scroll animations:** each block fades and rises into place once, when it scrolls into view (`Reveal` in `LandingPage.jsx`, `.reveal` in `index.css`). Only opacity and position change, which the graphics card animates without repainting. People who ask their system for less motion see everything immediately.
- **What did not help:** `will-change` (prepared layers) and keeping layers after the animation – no measurable gain, more memory, so not used. Chrome's long-animation-frame report showed 0 ms of script while scrolling: the remaining cost is painting, which is why fewer, larger blocks helped most.

### Tests

New end-to-end tests in `landing.spec.js`: from the login and join pages the Back link and the logo lead to the front page; in dark mode the closing Join button has a contrast of at least 4.5:1, and an FAQ answer opens. Mutation-checked: with the old button code the test fails (contrast 1.23). 685 API, 33 screen and 14 end-to-end tests pass; lint clean.
