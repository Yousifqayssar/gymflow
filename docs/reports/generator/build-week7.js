// Builds the Week 7 report: Reproducibility, Installation and Integration.
// usage: node build-week7.js <out.docx>   (needs week-07-fresh-install.json and img/ next to this file)
const fs = require('fs');
const path = require('path');
const { PageBreak, Paragraph } = require('docx');
const {
  p, lead, why, note, h1, h2, bullets, list, table, sheet, gap, code, fig, coverPage, buildDocument, writeDocument,
} = require('./report-lib');

const evidence = JSON.parse(fs.readFileSync(path.join(__dirname, 'week-07-fresh-install.json'), 'utf8'));
const out = process.argv[2] || 'week-07-report.docx';
const REPO = 'https://github.com/Yousifqayssar/gymflow';
const commit = (hash) => `${REPO}/commit/${hash}`;
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

const children = [
  ...coverPage({ week: 7, stage: 'Stage 5: Reproducibility, Installation and Integration', date: '23 November 2026', status: 'Completed' }),

  // 1 ─────────────────────────────────────────────────────────────
  h1('1. Summary'),
  p('The goal of Week 7 was that **another developer can understand, install, run and test GymFlow using only the written instructions**. To prove this, the project was downloaded from GitHub into an empty folder on 23 November and installed by following the README step by step, with a new, empty database. Every step was recorded with its real result and time.'),
  p('All 14 steps worked. The fresh copy ran the complete app and passed all **685 API tests, 33 screen tests and 12 end-to-end tests**. The test also showed that the README described GymFlow as it was in the first weeks: most features, 40 of the 61 API endpoints and several setup details were missing. The README was rewritten and now covers everything a new developer needs, including troubleshooting and how the live site is hosted.'),
  p('The week also brought the features of Stage 5 into the integrated system: a public front page, an admin dashboard with revenue and class attendance, an accessibility and performance pass, and a script for user tests. A check-in bug found by the integration tests was fixed.'),
  lead('Key results'),
  table([4200, 4826], [
    ['Measure', 'Result (23 November 2026)'],
    ['Fresh install from GitHub, following only the README', '14 of 14 steps PASS'],
    ['Time from download to a running app (commands only)', 'about 2 minutes (4 + 36 + 39 + 14 + 5 + 23 + 5 s)'],
    ['Tests on the fresh copy', 'API 685/685 · screen 33/33 · end-to-end 12/12'],
    ['README API table', '21 → all 61 endpoints'],
    ['Lint check of the website code', '1 warning → 0'],
    ['Bugs found by integration tests and fixed', '1 (second typed check-in ignored)'],
  ], { boldFirst: true }),

  // 2 ─────────────────────────────────────────────────────────────
  h1('2. Objectives of Week 7'),
  table([600, 5000, 3426], [
    ['#', 'Objective', 'Result'],
    ['1', 'Installation instructions that a new developer can follow without help', 'README rewritten and checked by a fresh install (section 3)'],
    ['2', 'Prove the project can be reproduced from GitHub alone', '14/14 steps PASS on an empty folder (section 4)'],
    ['3', 'Show how the parts work together and test them together', 'Integration map and 12 end-to-end tests (section 5)'],
    ['4', 'Integrate the Stage 5 features into the system', 'Front page, dashboard, accessibility, user-test script (section 7)'],
  ], { boldFirst: true }),

  // 3 ─────────────────────────────────────────────────────────────
  h1('3. Installation Guide (README)'),
  p('The README in the root of the repository is the installation guide. A developer needs only Git, Node.js 24, Docker Desktop and, for the end-to-end tests, Google Chrome. The database runs in Docker, so PostgreSQL does not have to be installed.'),
  h2('3.1 What the README now contains'),
  table([3000, 6026], [
    ['Section', 'Content'],
    ['Features + live demo', 'All features of GymFlow and the link to the live site'],
    ['Prerequisites', 'Git, Node 24, Docker Desktop (with the WSL 2 note for Windows), Chrome; the clone command'],
    ['1. Settings', 'Copy the three .env.example files; what each value means; the optional Gemini key; what to do when port 5432 is taken'],
    ['2.–4. Run', 'Start the database, install and start the API, install and start the website'],
    ['5. Demo data', 'One command; the demo accounts and what each is good for'],
    ['6. Check', 'A table of checks with the expected result: health, login, classes, tests'],
    ['Running tests', 'The three test suites, their size and duration, and a Windows note'],
    ['API endpoints', 'All 61 endpoints with who may use them; status codes; error shape; test cards'],
    ['Deployment', 'How the live site runs on Render + Neon: build and start commands, settings'],
    ['Troubleshooting', 'Seven common problems and their fix'],
  ], { boldFirst: true }),
  h2('3.2 Short version of the installation'),
  code([
    'git clone https://github.com/Yousifqayssar/gymflow.git',
    'cd gymflow',
    'cp .env.example .env                          # then fill in the values',
    'cp server/.env.example server/.env',
    'cp server/.env.test.example server/.env.test',
    'docker compose up -d                          # database',
    'cd server; npm install; npx prisma migrate deploy; npm run db:seed; npm run dev',
    'cd client; npm install; npm run dev           # second terminal → http://localhost:5173',
  ]),
  why('reproducibility depends on more than the commands. All package versions are fixed in package-lock.json files that are in Git, the database is a fixed Docker image (postgres:16-alpine), the database structure is built from 18 migrations in Git, and the settings come from templates. The demo data uses dates relative to today, so a fresh copy always has upcoming classes.'),

  // 4 ─────────────────────────────────────────────────────────────
  pageBreak(),
  h1('4. Reproducibility Test – Fresh Install from GitHub'),
  h2('4.1 Method'),
  p('The project was cloned from GitHub into a new, empty folder and every README step was run in order in PowerShell. Nothing was copied from the existing project folder: the settings files were created from the templates with new random secrets, and the database started from an empty Docker volume. For each step the expected result was written down from the README, then compared with what actually happened.'),
  table([2600, 6426], [
    ['Item', 'Value'],
    ['Source', evidence.source],
    ['Computer', evidence.machine],
    ['Date', '23 November 2026'],
    ['One adaptation', evidence.adaptation],
  ], { boldFirst: true }),
  h2('4.2 Results'),
  table([560, 1500, 2100, 3266, 900, 700], [
    ['ID', 'Step', 'Command', 'Actual result', 'Time', 'Status'],
    ...evidence.steps.map((s) => [s.id, s.step, s.command, s.actual, s.time, s.status]),
  ], { boldFirst: true, size: 17, statusCol: 5 }),
  note('Times are the measured duration of each command on this computer. The Docker image postgres:16-alpine was already downloaded, so the time of its one-time download is not included.'),
  ...fig('fresh-member-home.png', 6.0, 'The freshly installed copy: member home page after logging in as the demo member Elif'),
  ...fig('fresh-classes.png', 6.0, 'The freshly installed copy: the Classes page with the demo classes of the next two weeks'),
  h2('4.3 Gaps found in the README'),
  p('The install itself worked, but the README did not describe the system a new developer would find:'),
  ...bullets(evidence.readmeGaps),
  p('All of these were corrected (section 6, problems P1–P3). The README is the part of the project a new developer reads first; out-of-date instructions are a reproducibility problem even when the code is right.'),

  // 5 ─────────────────────────────────────────────────────────────
  h1('5. Integration – How the Parts Work Together'),
  h2('5.1 Components'),
  table([2000, 2700, 4326], [
    ['Part', 'Technology', 'How it connects'],
    ['Website (client)', 'React 19, Vite 8, Tailwind 4', 'Calls the API under /api with the login token. In development Vite forwards /api to port 4000; online the same server sends both, so there is one address.'],
    ['API (server)', 'Node 24, Express 5, Zod', 'route → controller → service → Prisma. Checks login, role and every business rule.'],
    ['Database', 'PostgreSQL 16 via Prisma 7', 'Local: Docker container. Online: Neon. Same 18 migrations in both.'],
    ['Food scanner', 'Google Gemini', 'Optional. Server-side only, so the key never reaches the browser. 30-second time budget with a fallback model.'],
    ['Map', 'Leaflet + OpenStreetMap tiles', 'Loaded by the browser; allowed by the Content Security Policy (img-src).'],
    ['Hosting', 'Render (web) + Neon (database)', 'A push to main builds everything with one command and applies migrations.'],
  ], { boldFirst: true, size: 18 }),
  h2('5.2 Integration tests'),
  p('The 12 end-to-end tests check the integrated system the way a user sees it: they build the website, start the server in production mode on port 4300 with its own database (gymflow_e2e, filled with fresh demo data) and control Google Chrome. Each test passes through every layer – browser, website, API, database – and back.'),
  table([2000, 7026], [
    ['Area', 'End-to-end test'],
    ['Security', 'the website is served with the security headers'],
    ['Login', 'a wrong password is refused with a clear message'],
    ['Login', 'a logged-out admin who opens Payments logs in and comes back to Payments'],
    ['Roles', 'a member cannot open admin pages'],
    ['Session', 'a login that stopped working (demo data refreshed) leads politely back to login and to the same page'],
    ['Booking', 'a Premium member books a class with an included class and cancels it again'],
    ['Payment', 'a Basic member pays for a single class by card, then cancels and gets a refund'],
    ['Check-in', 'a trainer checks members in by member number'],
    ['Front page', 'a logged-out visitor sees the public landing page, not the login form'],
    ['Front page', 'the landing page leads to join and to log in'],
    ['Front page', 'a logged-in member who opens the landing page is taken into the app'],
    ['Phone', 'on a phone the member uses the bottom tab bar and the "More" sheet'],
  ], { boldFirst: true, size: 18 }),
  p('Below the end-to-end tests, the 685 API tests check the API and database together against a real PostgreSQL test database (not a mock), and the 33 screen tests check the website components. Results on the fresh copy:'),
  code([
    'server> npm test   Test Files  40 passed (40)   Tests  685 passed (685)   (336 s)',
    'client> npm test   Test Files   6 passed (6)    Tests   33 passed (33)    (20 s)',
    'e2e>    npm test   12 passed (58.4 s)',
  ]),

  // 6 ─────────────────────────────────────────────────────────────
  h1('6. Problems Found, Corrections and Retests'),
  ...[
    ['P1', 'README described only the first stages', 'Fresh install (4.3): features, roles and API table were out of date – 21 of 61 endpoints, no 402/429 codes.', 'The README was written step by step during Stages 0–2 and not updated when features were added.', 'Features, roles and the full API table rewritten from the route files; error shape and test cards added.', 'Every endpoint in the table compared with the 15 route files: 61/61 listed with the right role.', 'docs: update README for a fresh install (this week)'],
    ['P2', 'Demo data described wrongly', 'README said 4 plans; the fresh run printed 6 plans and many more records.', 'The demo script grew with every stage; the README text stayed.', 'Text replaced by what the script really creates, with a table of demo accounts.', 'R10 output matches the README text.', 'docs: update README for a fresh install (this week)'],
    ['P3', 'Missing setup details', 'No word about the Gemini key, a busy port 5432, hosting, or common errors.', 'These were known only to the developer.', 'Settings notes, "Check that everything works", Deployment and Troubleshooting sections added.', 'The fresh install needed exactly the port note (5433) – now documented.', 'docs: update README for a fresh install (this week)'],
    ['P4', 'Check-in ignored a second typed number', 'End-to-end check-in test failed when run just after midnight.', 'A 10-second repeat guard meant for the camera also blocked numbers typed by staff. Earlier runs passed only because demo data already had a visit that day.', 'Guard applies only to camera scans; two new screen tests.', 'With the old code the new test fails (1 failed, 32 passed); with the fix 33/33 and e2e 12/12, also on the fresh copy.', '99726b0'],
    ['P5', 'Screen tests sometimes did not start', '"Vitest failed to find the current suite."', 'Only when started from Git Bash, which passes the drive as d:\\ instead of D:\\, so the test library is loaded twice.', 'Run from PowerShell; documented in the README and troubleshooting table.', '33/33 three times in a row from PowerShell; 33/33 on the fresh copy.', 'docs: update README for a fresh install (this week)'],
    ['P6', 'Lint warning in the website code', 'npm run lint on the fresh copy: 1 warning (unused variable).', 'theme-init.js caught an error into a variable it never used.', 'Removed the variable and explained why the error is ignored.', 'npm run lint: 0 warnings, 0 errors.', 'docs: update README for a fresh install (this week)'],
  ].flatMap(([id, title, failure, diagnosis, correction, retest, c]) => [
    h2(`${id} – ${title}`),
    sheet([
      ['Failure', failure],
      ['Diagnosis', diagnosis],
      ['Correction', correction],
      ['Retest', retest],
      ['Status', 'Fixed – PASS'],
      ['Commit', /^[0-9a-f]{7}$/.test(c) ? `${c} – ${commit(c)}` : c],
    ]),
    gap(),
  ]),

  // 7 ─────────────────────────────────────────────────────────────
  h1('7. Stage 5 Features Integrated This Week'),
  table([2400, 6626], [
    ['Feature', 'What it does'],
    ['Public front page', 'Visitors who are not logged in see /welcome: what GymFlow offers, Basic vs Premium plans, partner gyms, and Join / Log in buttons. Logged-in users go straight into the app.'],
    ['Map tiles fixed online', 'OpenStreetMap refused the tiles because the site sent no Referer. The Referrer-Policy is now strict-origin-when-cross-origin.'],
    ['Admin dashboard', 'New admin-only endpoint GET /api/gym/admin-dashboard: paid revenue per month for 6 months, and class attendance (attended vs no-shows) for the last 30 days.'],
    ['Accessibility', 'A "Skip to main content" link on the first Tab key press, for keyboard users (WCAG 2.4.1).'],
    ['Performance', 'Class photos converted from JPG to WebP: 1,015 kB → 520 kB. Small pictures further down load only when scrolled to.'],
    ['User-testing script', 'docs/user-testing/user-testing-script.md: tasks for a member, a trainer and an admin, with questions and a results sheet.'],
  ], { boldFirst: true }),
  ...fig('dashboard-light.png', 6.0, 'Admin dashboard with monthly revenue and class attendance'),
  p('Each feature came with its own tests: gym-admin-dashboard.test.js (revenue per month, ignored payment states, attendance rate, admin-only access), MonthlyRevenueBars.test.jsx (chart and screen-reader table), and landing.spec.js (three end-to-end tests of the front page).'),

  // 8 ─────────────────────────────────────────────────────────────
  h1('8. Development Stage 5 Record'),
  sheet([
    ['Date and objective', '18–23 November 2026. Make GymFlow reproducible: another developer can install, run and test it from the documentation; integrate the Stage 5 features.'],
    ['Functionality and technical decision', 'Rewritten README (installation, checks, tests, API, deployment, troubleshooting); fresh-install test from GitHub; admin dashboard, front page, accessibility and performance. Decision: prove reproducibility by a real install into an empty folder with a new database instead of only reading the README – it found gaps that reading did not.'],
    ['Problem and solution', 'The README described the first stages only (P1–P3) → rewritten from the code and checked against the fresh run. Check-in ignored a second typed number (P4) → repeat guard only for the camera. Lint warning (P6) → fixed.'],
    ['Evidence and GitHub commit', 'Section 4 (R01–R14 all PASS, Figures 1–2), section 5.2 (685 + 33 + 12 tests on the fresh copy), docs/reports/evidence/week-07-fresh-install.json. Commits in section 10.'],
    ['Next step', 'Week 8: user tests with real people, and a classmate installs GymFlow from the README on their own computer (section 12).'],
  ], [3000, 6026]),

  // 9 ─────────────────────────────────────────────────────────────
  h1('9. Results and Limitations'),
  h2('9.1 Results'),
  ...bullets([
    '**Reproducible:** a copy downloaded from GitHub installs and runs with the README alone; all 14 steps and all 730 tests pass.',
    '**Fast to set up:** about 2 minutes of commands from download to a running app with demo data (not counting the one-time Docker image download).',
    '**Integrated:** the same build runs locally, in the end-to-end tests and online; one command builds everything for hosting.',
  ]),
  h2('9.2 Limitations'),
  ...bullets([
    '**Same computer:** the fresh install ran on the developer\'s computer, where Node, Docker and the database image were already installed. A test on another person\'s computer is planned for Week 8.',
    '**Port and container name:** because the developer\'s own database already uses port 5432 and the name gymflow-db, the fresh copy used port 5433 and a renamed container. A new developer would not need this; the port case is now in the README.',
    '**Package advisories:** npm install on the server still reports the 6 advisories found in the Week 6 re-check (4 high, 2 moderate, published after Week 6). Two are in Express and can be fixed with npm audit fix; the other two are only in the Prisma command-line tool.',
    '**Windows only:** the commands were run in PowerShell on Windows 11. The README commands also work in bash, but this was not tested on macOS or Linux.',
  ]),

  // 10 ────────────────────────────────────────────────────────────
  h1('10. Commit History'),
  table([1100, 1300, 6626], [
    ['Commit', 'Date', 'Message'],
    ['5f43d33', '22 Oct', 'fix: let OpenStreetMap see the site address so map tiles load'],
    ['d5682ac', '22 Oct', 'feat(client): add public landing page at /welcome'],
    ['ccf390f', '18 Nov', 'feat: add gym-health dashboard with monthly revenue and class attendance'],
    ['15ee090', '18 Nov', 'perf(client): add skip link and convert class photos to WebP'],
    ['d255813', '18 Nov', 'docs: add week 7 development log'],
    ['1d93be9', '22 Nov', 'docs: add user-testing script for stage 5'],
    ['99726b0', '23 Nov', 'fix(client): answer a second typed check-in and show 5 partner gyms'],
    ['e1ba86c', '23 Nov', 'docs: rebuild week 6 report to the university testing guide'],
    ['(new)', '23 Nov', 'docs: update README for a fresh install, and the week 7 report'],
  ], { mono: [0] }),
  p(`All commits: ${REPO}/commits/main`),

  // 11 ────────────────────────────────────────────────────────────
  h1('11. Week 7 Student Report Sheet'),
  sheet([
    ['Student / ID', '____________________  /  ____________'],
    ['Project title', 'GymFlow – A Web-Based Gym Membership, Class Management and Workout Tracking System'],
    ['GitHub URL', REPO],
    ['Week 7 dates', '18–23 November 2026'],
    ['Topic', 'Reproducibility, Installation and Integration'],
  ]),
  h2('11.1 Short summary'),
  p('GymFlow was downloaded from GitHub into an empty folder and installed using only the README. All 14 steps worked, and the fresh copy passed 685 API, 33 screen and 12 end-to-end tests. The install showed that the README was out of date, so it was rewritten with every feature, all 61 endpoints, checks, deployment and troubleshooting. Stage 5 features were integrated, and a check-in bug found by the integration tests was fixed.'),
  h2('11.2 Checklist'),
  ...bullets([
    '☑ Installation instructions in the README, checked by a fresh install',
    '☑ Fresh install from GitHub recorded step by step with real results (R01–R14)',
    '☑ All tests run on the fresh copy (685 / 33 / 12)',
    '☑ Integration of the parts described and tested end to end',
    '☑ Problems recorded as failure → diagnosis → correction → retest',
    '☑ Development Stage 5 record',
    '☑ Commits pushed to GitHub',
    '☐ Install on another person\'s computer (planned for Week 8)',
  ]),
  h2('11.3 Questions a supervisor may ask'),
  table([3300, 5726], [
    ['Question', 'Answer'],
    ['Can someone else install it without your help?', 'The README alone was enough for a fresh copy from GitHub: 14/14 steps PASS (section 4). It has not yet been tried by another person – planned for Week 8.'],
    ['How do you make sure the same versions are installed?', 'package-lock.json files are in Git, the database is a fixed Docker image, the tables come from 18 migrations in Git, and settings come from templates.'],
    ['How do you know the parts work together?', '12 end-to-end tests run the built website, the API and a real database together in Chrome; they passed on the fresh copy (section 5.2).'],
    ['What did the fresh install find?', 'An out-of-date README (P1–P3) and one lint warning (P6). The code installed and ran without changes.'],
    ['What about secrets?', 'Only .env.example templates are in Git; the real .env files are ignored. The fresh install created its own random secrets.'],
  ], { boldFirst: true, size: 18 }),

  // 12 ────────────────────────────────────────────────────────────
  h1('12. Next Step'),
  ...list([
    '**User tests:** run the user-testing script with a member, a trainer and an admin on their phones, and fix what they find.',
    '**Install by another person:** a classmate installs GymFlow from the README on their own computer; every question they ask becomes a README improvement.',
    '**Package advisories:** apply npm audit fix for the two Express advisories, run all tests, and deploy.',
  ]),
];

writeDocument(buildDocument({ headerText: 'Weekly Progress Report – Week 7', title: 'GymFlow – Week 7 Report', children }), out);
