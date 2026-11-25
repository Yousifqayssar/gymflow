# GymFlow – Career Materials

Drafts for the Week 9 career tasks. Every claim below is backed by evidence in this repository (links at the end). Read them, change the wording until it sounds like you, and only publish what you can explain.

## A. CV-ready project entry

**GymFlow – Gym Membership, Class Booking and Workout Tracking Web App** · Graduation project, Altınbaş University · 2026
Designed and built, as the sole developer, a full-stack web application that replaces paper cards and spreadsheets in a gym: memberships and card payments, QR check-in, class booking with capacity rules, trainer workout plans and progress tracking for three roles (admin, trainer, member).
- Built a REST API (Node.js, Express, PostgreSQL, Prisma) with 61 endpoints; booking, membership and payment rules run in database transactions with row locks, and tests with simultaneous requests prove there is no overbooking, no overlapping membership and no double charge.
- Built a React website that works as an installable phone app, with dark mode and accessibility features.
- Verified the system with 732 automated tests (API tests against a real database, screen tests, end-to-end tests in Chrome), including an automatic check of every endpoint against every role.
- Deployed it online (Render + Neon) and proved it reproducible: a fresh clone installs and passes all tests by following the README alone.

GitHub: https://github.com/Yousifqayssar/gymflow · Live demo: https://gymflow-bw46.onrender.com

## B. LinkedIn-ready project post (draft)

> **I built GymFlow – a gym management web app – as my graduation project. 🏋️**
>
> Many small gyms still run on paper cards, spreadsheets and messaging apps: the front desk can't see whose membership is expiring, members don't know if a class still has a spot, and workout plans live on paper.
>
> GymFlow puts all of this in one app for three roles. Members buy a membership, check in with a QR code on their phone, book classes and follow the workout plan their trainer wrote. Trainers manage their classes and take attendance with a changing QR code. The admin sees members, revenue and class attendance on one dashboard.
>
> I built it alone: a React website that installs like a phone app, a Node.js/Express REST API with the business rules, and a PostgreSQL database through Prisma – hosted on Render and Neon.
>
> **The hardest part** was making the rules impossible to break. Two members must never get the last spot in a class, and a payment must never be charged twice. I moved these rules into database transactions with row locks, added database constraints as a second line of defence, and wrote tests that try to break them.
>
> **How I know it works:** 732 automated tests – API tests against a real database, screen tests, and end-to-end tests in Chrome – plus a test that tries every endpoint with every role. I also cloned the project into an empty folder and installed it from the README alone to prove another developer can run it.
>
> **What I learned:** measure before you optimise. One "slow" AI feature took 195 seconds because a library silently retried five times – with a time budget and a fallback model it now answers in 9–19 seconds.
>
> **Next:** a real payment provider and reminders before a membership expires.
>
> Code: https://github.com/Yousifqayssar/gymflow · Try it: https://gymflow-bw46.onrender.com
>
> #SoftwareEngineering #WebDevelopment #React #NodeJS #PostgreSQL #GraduationProject

**Pictures to add:** the architecture diagram (`docs/diagrams/architecture.svg` – export it as PNG) and one screenshot, e.g. `docs/screenshots/04-class-booked.webp`. Screenshots contain demo data only.

## C. 60–120 second technical pitch

Speak it in your own words – these are the points, not a script to read.

1. **Problem (15 s).** Small gyms still manage members with paper and spreadsheets. Staff don't know whose membership is expiring, members don't know if a class is full, trainers hand out plans on paper.
2. **What I built (20 s).** GymFlow: one web app for the admin, trainers and members – memberships and card payments, QR check-in, class booking, workout plans and progress. I built all of it myself: the React website, the Express API and the PostgreSQL database.
3. **Technologies and why (15 s).** React for a fast app that installs on phones; Express and Prisma for a clear layered API; PostgreSQL because bookings and payments need transactions and constraints.
4. **Hardest challenge (20 s).** Making rules unbreakable – two members must never take the last spot, a card must never be charged twice. I used transactions with row locks and database constraints, and tested it with parallel requests.
5. **How I tested it (15 s).** 732 automated tests on three levels, a check of every endpoint against every role, and a clean install from GitHub that passed all tests.
6. **Next improvement (10 s).** A real payment provider for Turkey, and reminders before a membership expires.

## Evidence for the claims

| Claim | Evidence |
| --- | --- |
| 61 endpoints | [docs/api.md](../api.md) |
| Transactions with row locks, constraints | `server/src/services/booking.service.js`; [business rules](../business-rules.md) |
| 732 tests (685 + 33 + 14), every endpoint × every role | `server/tests/`, `client/src/**/*.test.jsx`, `e2e/tests/`; `route-protection.test.js`; [traceability](../traceability.md) |
| Fresh clone passes with the README alone | [Week 7 evidence](../reports/evidence/week-07-fresh-install.json); Week 9 final audit |
| Food scanner 195 s → 9–19 s | Week 6 report, failure D2 |
| Deployed | https://gymflow-bw46.onrender.com |
