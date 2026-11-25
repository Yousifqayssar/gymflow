# Requirements Traceability

Every requirement of GymFlow → the code that implements it → the evidence that it works → its actual status.
Requirements F1–F9 are the original requirements, E1–E6 extensions added during the project (project report, chapter 3).

**Status:** **Pass** = implemented and proven by tests that pass · **Partial** = implemented, but part of it is not proven or is simplified · **Not tested** = implemented, but no evidence yet.

Evidence as of 25 November 2026, commit `70eddbf`: 685 API tests (40 files, `server/tests/`), 33 screen tests (6 files, `client/src/**/*.test.jsx`), 14 end-to-end tests (`e2e/tests/`), documented test cases T01–T18 ([Week 6 evidence](reports/evidence/week-06-test-cases.json)) and the clean-environment install R01–R06 ([Week 7 evidence](reports/evidence/week-07-fresh-install.json)). All pass.

## Functional requirements

| ID | Requirement | Implementation | Evidence / tests | Status |
| --- | --- | --- | --- | --- |
| F1 | Register, log in and log out; role-based access | `auth.routes.js`, `auth.service.js`, middleware `authenticate.js` / `authorize.js`; client `AuthProvider`, `ProtectedRoute` | `auth.test.js`, `middleware.test.js`, `security.test.js`, `route-protection.test.js` (197 automatic checks: every endpoint × every role); e2e `login.spec.js` (5); T01–T08 | **Pass** |
| F2 | Manage plans; sell memberships with automatic dates | `plan.service.js`, `membership.service.js`, `utils/dates.js`; pages `PlansPage`, `MemberDetailPage` | `plans.test.js`, `memberships.test.js`, `users.test.js`, `unit/dates.test.js` (end-of-month rule, leap years) | **Pass** |
| F3 | See membership status and expiring memberships | `utils/membershipStatus.js`, `GET /api/me/membership`, `GET /api/users?status=` | `unit/membershipStatus.test.js`, `my-membership.test.js`, `users.test.js` (status filters) | **Pass** |
| F4 | Create, edit and cancel classes | `class.service.js`; pages `ClassFormPage`, `ClassDetailPage` | `classes.test.js` (own-class rule for trainers, past classes locked, capacity) , `classes-database.test.js` | **Pass** |
| F5 | Book and cancel classes with capacity rules | `booking.service.js` (transaction + row locks), unique index; `BookingPanel.jsx` | `bookings.test.js`, `classes-database.test.js` (database refuses a second booking), `BookingPanel.test.jsx` (8); e2e `booking.spec.js` (2); T17 | **Pass** |
| F6 | Check members in with a QR code or member number | `checkIn.service.js`, `GET /api/me/qr`; `CheckInPage.jsx`, `QrScannerCard` | `check-ins.test.js`, `check-ins-database.test.js`, `me-qr-visits.test.js`, `CheckInPage.test.jsx` (9); e2e `check-in.spec.js`; T09–T12 | **Partial** – the camera scanner is replaced by a stand-in in the tests; scanning with a real camera is not covered by automated tests |
| F7 | Exercise library and workout plans | `exercise.service.js`, `workoutPlan.service.js`; `ExercisesPage`, `PlanEditorPage` | `exercises.test.js`, `workout-plans.test.js` (API); no end-to-end test of the pages | **Pass** (API) |
| F8 | Log workouts and see progress charts | `workoutLog.service.js`, `progress.service.js`; `WorkoutSessionPage`, `ProgressPage` | `workout-logs.test.js`, `progress.test.js`, `unit/progress.test.js` | **Pass** (API) |
| F9 | Dashboard with key numbers | `gym.service.js` (`getStats`, `getAdminDashboard`); `AdminHome.jsx`, `MonthlyRevenueBars.jsx` | `gym-stats.test.js`, `gym-admin-dashboard.test.js` (revenue per month, attendance rate, admin only), `MonthlyRevenueBars.test.jsx` | **Pass** |

## Extensions

| ID | Requirement | Implementation | Evidence / tests | Status |
| --- | --- | --- | --- | --- |
| E1 | Loyalty points, levels and discounts | `utils/points.js` (10 per visit; Silver 5%, Gold 10%, Platinum 15%), points once per day (unique index) | `unit/points.test.js`, `check-ins.test.js` and `me-qr-visits.test.js` (points after check-in), `memberships.test.js` (discount) | **Pass** |
| E2 | Online card payments, receipts, payments overview | `cardGateway.js` (built-in **test** gateway), `payment.service.js`; `CardCheckout.jsx`, `PaymentsPage` | `payments.test.js`, `class-payments.test.js`, `unit/cardGateway.test.js`, `CardCheckout.test.jsx` (6); e2e paid class + refund; T13–T16 | **Partial** – works end to end with test cards; no real payment provider (Stripe is not available in Turkey, iyzico declined), so no real money moves |
| E3 | Class attendance QR and no-show penalty | `attendance.service.js` (code changes every 30 s) | `attendance.test.js` (20) | **Pass** (API) |
| E4 | Basic / Premium memberships, paying per class | `classBalance.service.js` (10 classes per membership month, extra classes −30%) | `class-balance.test.js`, `class-payments.test.js`, `partner-gym-access.test.js` | **Pass** |
| E5 | Body check-ins, partner-gym map, food scanner | `body.service.js`, `partnerGym.service.js`, `nutrition.service.js` (Google Gemini, 30 s budget) | `body.test.js`, `partner-gyms.test.js`, `nutrition.test.js` (Gemini replaced by a stand-in: time budget, fallback, messages) | **Partial** – the calories are estimates from Google's model; their accuracy was not measured |
| E6 | App-style phone layout, installable app | `AppLayout.jsx` (bottom tab bar), `manifest.webmanifest`, `sw.js` | e2e `phone.spec.js` (Pixel 7 size: tab bar and "More" sheet) | **Partial** – the phone layout is tested; installing the app on a real phone has not been tested yet |

## Non-functional requirements

| Quality | Implementation | Evidence | Status |
| --- | --- | --- | --- |
| Security | bcrypt, signed JWT, role checks on the server, Zod validation, security headers (CSP), login limit, secrets only in `.env` | `route-protection.test.js` (mutation check: 80 of 197 checks fail when the role check is switched off), `security.test.js`, T01–T08, T18; Git history checked for secrets (only placeholders) | **Pass** – 1 npm advisory left in a build-time tool (Prisma CLI), documented |
| Reliability | Transactions with row locks, database constraints | 685 + 33 + 14 automated tests | **Pass** |
| Responsiveness | One code base, phone layout below 1024 px | e2e `phone.spec.js`; screenshots | **Pass** |
| Performance | Food scanner within 30 s; WebP photos; light scroll animations | Food scanner 195 s → 9–19 s (Week 6); front page scroll: 1.7% slow frames on a simulated phone (Week 8 log) | **Pass** |
| Accessibility | Skip link, labels, keyboard focus, reduced motion, contrast | Source-code review (Week 7); e2e contrast check of the closing button (≥ 4.5 : 1) | **Partial** – no full automatic WCAG scan, no screen-reader test with users |
| Usability | Plain-language messages, one-tap actions | User-testing script ready (`docs/user-testing/user-testing-script.md`) | **Not tested** – sessions with real users planned for 26 November |
| Portability / reproducibility | Docker database, `.env.example`, lock files, migrations | Clean install from GitHub: R01–R06 all pass (Week 7) | **Pass** on Windows; macOS/Linux not tested; peer install planned |
