// Builds the Week 7 report, structured like the university's Week 7 guide
// ("Reproducibility, installation and integration": six tasks, Steps 1–6, Stage 5 record, questions, checklist).
// usage: node build-week7.js <out.docx>   (needs week-07-fresh-install.json and img/ next to this file)
const fs = require('fs');
const path = require('path');
const { PageBreak, Paragraph, Table, TableRow, WidthType } = require('docx');
const {
  p, lead, why, note, h1, h2, bullets, list, table, sheet, gap, code, fig, cell, coverPage, buildDocument, writeDocument,
} = require('./report-lib');

const evidence = JSON.parse(fs.readFileSync(path.join(__dirname, 'week-07-fresh-install.json'), 'utf8'));
const out = process.argv[2] || 'week-07-report.docx';
const REPO = 'https://github.com/Yousifqayssar/gymflow';
const link = (hash) => `${REPO}/commit/${hash}`;
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// A row of boxes joined by arrows: the path of one request through the system.
function flow(steps) {
  const arrow = 300;
  const box = Math.floor((9026 - arrow * (steps.length - 1)) / steps.length);
  const widths = steps.flatMap((_, i) => (i === 0 ? [box] : [arrow, box]));
  const cells = steps.flatMap((text, i) => {
    const boxCell = cell(text, box, { fill: i === 0 || i === steps.length - 1 ? 'EAF0F7' : 'F7F9FC', bold: true, size: 17 });
    return i === 0 ? [boxCell] : [cell('→', arrow, { fill: 'FFFFFF', bold: true, size: 22 }), boxCell];
  });
  return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths, rows: [new TableRow({ children: cells })] });
}

const s = Object.fromEntries(evidence.steps.map((step) => [step.id, step]));

const children = [
  ...coverPage({ week: 7, stage: 'Stage 5: Reproducibility, Installation and Integration', date: '25 November 2026', status: 'Completed – peer test planned for 26 November' }),

  // 1 ─────────────────────────────────────────────────────────────
  h1('1. Summary'),
  p('The key question of Week 7 is: **can another software engineer install and run GymFlow using only the repository and its instructions?** To answer it with evidence, the project was cloned from GitHub into an empty folder on 23 November and installed by following only the README, with a new, empty database and newly generated secrets.'),
  p('Every step worked. The fresh copy started, ran the main use case (a member logs in and books a class) and passed all **685 API tests, 33 screen tests and 12 end-to-end tests**. The test also showed that the README still described GymFlow as it was in the first weeks; it was rewritten and checked against the code. During the week, five real problems were corrected and committed (section 6.2). A test by a fellow student on their own computer is planned for 26 November (section 5.6).'),
  lead('Key results'),
  table([4300, 4726], [
    ['Measure', 'Result'],
    ['Clean-environment install from GitHub (R01–R06)', '6 of 6 PASS (14 of 14 detailed steps)'],
    ['Time of the install commands, download to running app', 'about 2 minutes (4 + 36 + 39 + 14 + 5 + 23 + 5 s)'],
    ['Tests on the fresh copy', 'API 685/685 · screen 33/33 · end-to-end 12/12'],
    ['Secrets in the Git history (127 commits)', 'none – only placeholders in .env.example files'],
    ['Problems corrected and committed', '5 (README, setup details, lint, check-in, package advisories)'],
    ['Peer installation test', 'planned for 26 November'],
  ], { boldFirst: true }),

  // 2 ─────────────────────────────────────────────────────────────
  h1('2. The Six Week 7 Tasks'),
  table([2000, 4826, 2200], [
    ['Task', 'What was done', 'Section'],
    ['1. System integration', 'One complete use case traced and tested through browser, website, API, business rules and database; 12 end-to-end tests of the whole system', '3'],
    ['2. Dependencies', 'Every runtime, framework, library and tool with the version actually tested', '4.1'],
    ['3. Installation guide', 'README rewritten: download, configure, install, build, run, expected output, tests, common problems', '4.2–4.4'],
    ['4. Reproducibility test', 'Clean-environment install recorded step by step (R01–R06); peer test prepared', '5'],
    ['5. GitHub improvements', 'README, screenshots, dependency files, peer test sheet; history checked for secrets', '4.2, 6.2'],
    ['6. Report update', 'This report: implementation, installation, testing, results, Stage 5 record, references', '3–10'],
  ], { boldFirst: true }),

  // 3 ─────────────────────────────────────────────────────────────
  h1('3. Implementation – System Integration'),
  h2('3.1 Components'),
  table([2000, 2700, 4326], [
    ['Component', 'Technology', 'How it connects'],
    ['Website (client)', 'React 19, Vite 8, Tailwind 4', 'Sends requests to /api with the login token. In development Vite forwards /api to port 4000; online the same server sends both, so there is only one address.'],
    ['API (server)', 'Node 24, Express 5, Zod', 'route → controller → service → Prisma. Checks the login, the role and every business rule.'],
    ['Database', 'PostgreSQL 16 via Prisma 7', 'Local: Docker container. Online: Neon. The same 18 migrations build both.'],
    ['Food scanner', 'Google Gemini (optional)', 'Called only by the server, so the key never reaches the browser. 30-second budget with a fallback model.'],
    ['Map', 'Leaflet + OpenStreetMap tiles', 'Tiles loaded by the browser, allowed by the Content Security Policy.'],
    ['Hosting', 'Render (web service) + Neon (database)', 'A push to main builds everything with one command and applies the migrations.'],
  ], { boldFirst: true, size: 18 }),
  h2('3.2 One complete use case: a member books a class'),
  p('The guide asks to run a complete use case from input to output. For a web application this is: user action → application logic → database → displayed result. The path of one class booking:'),
  flow(['Member taps "Book"', 'React website', 'Express API: token + role', 'Booking rules (transaction)', 'PostgreSQL', '"Booked" shown']),
  gap(),
  table([600, 2200, 6226], [
    ['#', 'Component (file)', 'What happens'],
    ['1', 'Website – BookingPanel.jsx', 'The member opens a class and taps Book.'],
    ['2', 'Website – api/classes.js', 'bookClass() sends POST /api/classes/:id/book with the login token.'],
    ['3', 'API – middleware', 'Security headers; authenticate checks the token (401 if missing or forged); authorize allows only the MEMBER role (403).'],
    ['4', 'API – booking.service.js', 'One database transaction locks the class and the member (SELECT … FOR UPDATE), then checks: valid membership on the day of the class (403), not booked already (409), not full (409), classes left this month.'],
    ['5', 'Database – PostgreSQL', 'Prisma saves the booking. A unique index on (class, member) is a second guard against double bookings.'],
    ['6', 'Website – result', 'The API returns the updated class; the page shows "Booked", one spot less and one class less in the monthly allowance.'],
  ], { boldFirst: true, size: 18 }),
  p('**Evidence:** the end-to-end test "a Premium member books a class with an included class and cancels it again" runs exactly this path in Chrome against the production build and a real database; it passed on the fresh copy (section 5). Figure 2 shows a booked class (from the demo data) on the fresh copy.'),
  h2('3.3 Architecture changes'),
  p('No structural change was made in Week 7. The architecture is the one from Week 5 (one web service: the Express server also sends the built website) with the Week 6 security layer (security headers, login limit) in front of the routes. The diagram in the project report remains valid.'),

  // 4 ─────────────────────────────────────────────────────────────
  h1('4. Installation and Deployment'),
  h2('4.1 Dependencies and environment (versions actually tested)'),
  table([2300, 3400, 3326], [
    ['Requirement', 'Tested version', 'Where it is defined'],
    ['Runtime / language', 'Node.js 24.12.0 (JavaScript)', 'README; "engines": "24.x" in package.json'],
    ['Package manager', 'npm 11.6.2', 'package-lock.json in server/, client/, e2e/ (exact versions)'],
    ['Database', 'PostgreSQL 16.15 (image postgres:16-alpine)', 'docker-compose.yml'],
    ['Containers', 'Docker Desktop, Docker 29.8.2 (WSL 2 on Windows)', 'README prerequisites'],
    ['Server libraries', 'Express 5.3.0, Prisma 7.10.1, Zod 4.6.7, helmet 8.3.0, express-rate-limit 8.7.1, jsonwebtoken 9.0.3, bcryptjs 3.0.3, @google/genai 2.27.0', 'server/package.json'],
    ['Website libraries', 'React 19.3.0, React Router 8.4.0, Vite 8.3.4, Tailwind CSS 4.3.3, motion 13.5.1, Leaflet 1.9.4, three 0.186.1', 'client/package.json'],
    ['Test tools', 'Vitest 5.0.3, Supertest 7.3.0, Testing Library 16.3.3, jsdom 30.1.2, Playwright 1.64.0', 'package.json files'],
    ['Operating system', 'Windows 11 (PowerShell); commands also written for bash', 'README'],
    ['Hardware', 'Any computer that runs Docker Desktop; no special hardware or GPU', '–'],
    ['Browser', 'Google Chrome (used by the end-to-end tests)', 'e2e/playwright.config.js'],
  ], { boldFirst: true, size: 18 }),
  why('package-lock.json fixes the exact version of every package, including the packages they depend on, so a fresh install gets the same code that was tested. The hosting build uses npm ci, which installs exactly the lock file and fails if it does not match package.json.'),
  h2('4.2 Configuration, sample data and secrets'),
  table([2600, 6426], [
    ['File', 'Purpose'],
    ['.env.example', 'Database name, user, password and port for Docker'],
    ['server/.env.example', 'API settings: database address, login-token secret, time zone, first admin account, optional Gemini key'],
    ['server/.env.test.example', 'A separate test database (name must end in _test)'],
    ['docker-compose.yml', 'The PostgreSQL container with a health check'],
    ['prisma/migrations (18)', 'Builds every table from nothing: npx prisma migrate deploy'],
    ['npm run db:seed / db:seed:demo', 'First admin account; demo data (6 plans, 2 trainers, 12 members, 25 classes, payments, check-ins …)'],
  ], { boldFirst: true, size: 18 }),
  p('**Secrets:** real .env files are ignored by Git (.gitignore: .env and .env.* except the examples). The whole history (127 commits) was searched: the only password, key and secret lines ever committed are the placeholders of the example files (e.g. change_me); no Google API key and no online database address with a password appear. The fresh install generated its own random secrets.'),
  h2('4.3 Installation procedure'),
  p('From the README (Windows PowerShell; the same commands work in bash):'),
  code([
    'git clone https://github.com/Yousifqayssar/gymflow.git',
    'cd gymflow',
    'cp .env.example .env                       # then fill in the values (README step 1)',
    'cp server/.env.example server/.env',
    'cp server/.env.test.example server/.env.test',
    'docker compose up -d                       # database; "docker compose ps" shows healthy',
    'cd server',
    'npm install',
    'npx prisma migrate deploy                  # creates the tables',
    'npm run db:seed                            # first admin account',
    'npm run db:seed:demo                       # optional demo data',
    'npm run dev                                # API on http://localhost:4000',
    'cd ../client                               # in a second terminal',
    'npm install',
    'npm run dev                                # website on http://localhost:5173',
  ]),
  lead('Expected output (real output of the fresh install)'),
  code([
    '> npx prisma migrate deploy',
    '18 migrations found in prisma/migrations',
    'All migrations have been successfully applied.',
    '> GET http://localhost:4000/api/health',
    '{"status":"ok","database":"up", …}',
    '> npm run db:seed:demo',
    'Demo data ready: 6 plans, 2 trainers, 12 members, 25 classes, 145 check-ins, …',
  ]),
  h2('4.4 Common installation problems'),
  table([3800, 5226], [
    ['Problem', 'Fix (also in the README)'],
    ['"cannot connect to the Docker daemon"', 'Start Docker Desktop and wait for "Engine running"'],
    ['Port 5432 already in use', 'POSTGRES_PORT=5433 in .env and port 5433 in both DATABASE_URL lines'],
    ['Health check says "database": "down"', 'Container not running, or the password in DATABASE_URL does not match .env'],
    ['Classes page empty some weeks later', 'Demo classes cover 14 days: run npm run db:seed:demo again'],
    ['Dev server stopped after npx prisma generate (Windows)', 'Normal; start it again with npm run dev'],
    ['Vitest: "failed to find the current suite"', 'Run the tests from PowerShell, not Git Bash'],
    ['Food scanner "not set up yet"', 'Add GEMINI_API_KEY to server/.env (optional feature)'],
  ], { boldFirst: true, size: 18 }),
  h2('4.5 Deployment'),
  p('The live demo (https://gymflow-bw46.onrender.com) is one Render web service connected to the GitHub repository. Build command npm run build (installs server and website with npm ci, builds the website, applies the migrations); start command npm start. The database is Neon PostgreSQL. Settings are entered in Render, never in Git. Every push to main deploys again.'),

  // 5 ─────────────────────────────────────────────────────────────
  h1('5. Testing and Validation – Reproducibility and Integration'),
  h2('5.1 Method'),
  p('Clean-environment test: the repository was cloned into a new, empty folder and only the README was followed, step by step. Nothing was copied from the developer\'s project folder. For each step the expected result was taken from the README and compared with what actually happened. The integration was tested by the end-to-end tests, which run the whole system together (section 5.5).'),
  h2('5.2 Test record'),
  sheet([
    ['Date', '23 November 2026'],
    ['Tester', 'The developer (peer test planned – section 5.6)'],
    ['Repository commit', 'e1ba86c – https://github.com/Yousifqayssar/gymflow/commit/e1ba86c'],
    ['Environment', evidence.machine],
    ['Clean environment', 'New empty folder, git clone from GitHub, new empty database volume, new random secrets'],
    ['Adaptation', evidence.adaptation],
  ]),
  h2('5.3 Results R01–R06'),
  table([560, 1500, 1900, 4166, 900], [
    ['ID', 'Operation', 'Expected result', 'Actual result', 'Status'],
    ['R01', 'Clone repository', 'Repository downloaded', `git clone finished in ${s.R01.time}; commit e1ba86c`, 'PASS'],
    ['R02', 'Install dependencies', 'Installation completes', `server npm install: exit 0 (${s.R04.time}); website: ${s.R08.actual} (${s.R08.time}); e2e: 3 packages (4 s)`, 'PASS'],
    ['R03', 'Configure system', 'Required settings work', `3 .env files from the templates; database healthy (${s.R03.time}); 18 migrations applied (${s.R05.time}); admin account created (${s.R06.time})`, 'PASS'],
    ['R04', 'Build / start', 'System starts correctly', 'API health: {"status":"ok","database":"up"}; website HTTP 200 on port 5173; production build started by the end-to-end tests', 'PASS'],
    ['R05', 'Main use case', 'Expected output produced', 'Demo data loaded; logged in as Elif: "Welcome back, Elif!" and 25 classes (Figures 1–2); the end-to-end booking test books a class and sees "Booked"', 'PASS'],
    ['R06', 'Run tests', 'Expected tests execute', `API 685/685 (${s.R12.time}); screen 33/33 + lint (${s.R13.time}); end-to-end 12/12 (60 s)`, 'PASS'],
  ], { boldFirst: true, size: 17, statusCol: 4 }),
  h2('5.4 Detailed step log'),
  table([560, 1600, 2300, 3266, 1300], [
    ['ID', 'Step', 'Command', 'Actual result', 'Time'],
    ...evidence.steps.map((step) => [step.id, step.step, step.command, step.actual, step.time]),
  ], { boldFirst: true, size: 16 }),
  note('Times are measured on this computer. The Docker image postgres:16-alpine was already downloaded, so its one-time download is not included. The detailed results are saved in docs/reports/evidence/week-07-fresh-install.json.'),
  h2('5.5 Terminal evidence'),
  code([
    'client> npm install      added 144 packages, and audited 145 packages in 23s',
    '                         found 0 vulnerabilities',
    'server> npm test         Test Files  40 passed (40)',
    '                         Tests  685 passed (685)      Duration 333.06s',
    'client> npm test         Test Files  6 passed (6)',
    '                         Tests  33 passed (33)',
    'e2e>    npm test         [WebServer] 18 migrations found … successfully applied',
    '                         [WebServer] Demo data ready: 6 plans, 2 trainers, 12 members …',
    '                         12 passed (58.4s)',
  ]),
  ...fig('fresh-member-home.png', 5.8, 'Fresh install (commit e1ba86c): member home page after logging in as the demo member Elif'),
  ...fig('fresh-classes.png', 5.8, 'Fresh install: the Classes page; the next class is marked "Booked"'),
  h2('5.6 Peer test'),
  p('The guide prefers that another student follows the README on their own computer. This is planned for **26 November 2026**. The tester fills in the same R01–R06 table on docs/user-testing/peer-install-sheet.md, together with every unclear instruction. Until then the clean-environment test above is the evidence, and this limitation is stated openly. The peer results and any README corrections will be added to the next report.'),

  // 6 ─────────────────────────────────────────────────────────────
  h1('6. Results'),
  h2('6.1 Execution results'),
  table([3600, 2700, 2726], [
    ['Check', 'Fresh copy (e1ba86c, 23 Nov)', 'main today (70eddbf, 25 Nov)'],
    ['API tests (Vitest + Supertest)', '685 / 685', '685 / 685'],
    ['Screen tests (Vitest + Testing Library)', '33 / 33', '33 / 33'],
    ['End-to-end tests (Playwright)', '12 / 12', '14 / 14 (2 new front-page tests)'],
    ['Lint (oxlint)', '1 warning', '0 warnings'],
    ['npm audit, server', '6 advisories', '1 advisory in a build-time tool (npm counts it 3×; 6.3)'],
  ], { boldFirst: true }),
  h2('6.2 Corrections'),
  ...[
    ['C1', 'README described only the first stages', 'The fresh install showed missing features, roles and 40 of 61 API endpoints; status codes 402 and 429 were missing.', 'The README was written in Stages 0–2 and not updated when features were added.', 'Features, roles and the full endpoint table rewritten from the 15 route files; error shape, test cards and demo accounts added.', 'All 61 endpoints compared with the route files.', 'de178b0'],
    ['C2', 'Missing setup details', 'No word about the optional Gemini key, a busy port 5432, hosting, or what to do when something fails.', 'Known only to the developer.', '"Check that everything works", Deployment and Troubleshooting sections; settings notes.', 'The fresh install needed exactly the port note (5433), which is now documented.', 'de178b0'],
    ['C3', 'Lint warning on a clean install', 'npm run lint: 1 warning (unused variable in theme-init.js).', 'A caught error was stored in a variable that was never used.', 'Variable removed, with a comment why the error is ignored.', 'npm run lint: 0 warnings.', 'de178b0'],
    ['C4', 'Check-in ignored a second typed number', 'The end-to-end check-in test failed when run just after midnight.', 'A 10-second repeat guard meant for the camera also blocked numbers typed by staff.', 'The guard applies only to camera scans; two new screen tests.', 'Old code: new test fails; fix: 33/33 screen and 12/12 end-to-end, also on the fresh copy.', '99726b0'],
    ['C5', 'Security advisories in server packages', 'npm install reported 6 advisories (4 high, 2 moderate), published after Week 6.', 'body-parser and qs inside Express, fast-uri, and effect inside the Prisma tool.', 'npm audit fix without --force: body-parser 2.4.0, qs 6.17.1, fast-uri 3.1.9.', '685 API and 12 end-to-end tests pass; 1 advisory left (6.3).', '80e73a8'],
  ].flatMap(([id, title, issue, diagnosis, solution, retest, c]) => [
    h2(`${id} – ${title}`),
    sheet([['Issue', issue], ['Diagnosis', diagnosis], ['Solution', solution], ['Retest', retest], ['Status', 'Fixed – PASS'], ['Commit', `${c} – ${link(c)}`]]),
    gap(),
  ]),
  h2('6.3 Limitations'),
  ...bullets([
    '**No peer test yet:** the clean install ran on the developer\'s computer, where Node.js, Docker and the database image were already installed. The peer test is planned for 26 November.',
    '**Port and container name:** the fresh copy used port 5433 and a renamed container because the developer\'s own database already runs on this computer. A new developer does not need this; the port case is in the README.',
    '**One package advisory left:** effect (high) is pinned by the Prisma command-line tool, also in the newest Prisma 7. It runs only during builds and never sees user input. npm audit fix --force would downgrade Prisma to version 6, so we wait for a Prisma update.',
    '**Tested on Windows only:** the commands are written for both PowerShell and bash, but were not run on macOS or Linux.',
  ]),

  // 7 ─────────────────────────────────────────────────────────────
  h1('7. Development Process – Stage 5 Record'),
  sheet([
    ['Date and objective', '18–25 November 2026. Integrate all parts into one system that another developer can install, configure, run and test from the documentation alone.'],
    ['Integrated components', 'React website, Express API with security layer, booking/membership/payment services, PostgreSQL via Prisma, Gemini food scanner, OpenStreetMap map, Render + Neon hosting. Stage 5 features: admin dashboard (revenue, attendance), public front page, accessibility and performance work.'],
    ['Technical decision', 'Prove reproducibility with a real install from GitHub into an empty folder with a new database, not by reading the README – it found gaps that reading had missed. Keep exact versions in package-lock.json and install them with npm ci online. No architecture change.'],
    ['Problem and solution', 'Out-of-date README (C1, C2) → rewritten from the code and checked against the fresh run; lint warning (C3); check-in bug found by integration tests (C4); new package advisories (C5) → safe update, one build-time advisory documented.'],
    ['Evidence and test results', 'R01–R06 all PASS (5.3); 14-step log (5.4); terminal output (5.5); Figures 1–2; 685 + 33 + 12 tests on the fresh copy; evidence file docs/reports/evidence/week-07-fresh-install.json.'],
    ['GitHub commit links', 'Section 7.1.'],
    ['Limitations and next step', 'Peer test on 26 November, user tests with friends, then Week 8 corrections (6.3, section 11).'],
  ], [2900, 6126]),
  h2('7.1 Commits of the week'),
  table([1100, 1000, 6926], [
    ['Commit', 'Date', 'Message'],
    ['ccf390f', '18 Nov', 'feat: add gym-health dashboard with monthly revenue and class attendance'],
    ['15ee090', '18 Nov', 'perf(client): add skip link and convert class photos to WebP'],
    ['d255813', '18 Nov', 'docs: add week 7 development log'],
    ['1d93be9', '22 Nov', 'docs: add user-testing script for stage 5'],
    ['99726b0', '23 Nov', 'fix(client): answer a second typed check-in and show 5 partner gyms'],
    ['de178b0', '23 Nov', 'docs: update README so a new developer can install, run and test GymFlow'],
    ['98cfa5b', '23 Nov', 'docs: add week 7 report on reproducibility, installation and integration'],
    ['80e73a8', '23 Nov', 'fix(server): update body-parser, qs and fast-uri for security advisories'],
    ['a69f78a', '24 Nov', 'feat(client): polish the public front page with real app screens, classes, map and FAQ'],
    ['8d9e84a', '24 Nov', 'feat(client): add a way back to the front page from login and join'],
    ['70eddbf', '24 Nov', 'perf(client): smoother front page scrolling with lightweight scroll animations'],
  ], { mono: [0], size: 18 }),
  p(`Each commit: ${REPO}/commit/<id> · all commits: ${REPO}/commits/main`),

  // 8 ─────────────────────────────────────────────────────────────
  h1('8. Answers to the Week 7 Questions'),
  table([3000, 6026], [
    ['Question', 'Answer'],
    ['1. What does software reproducibility mean, and why is it important?', 'Anyone can get the same working system from the repository and its instructions, with the same versions and the same results. Without it, a project only works on its developer\'s computer and cannot be checked, maintained or handed over.'],
    ['2. What dependencies are necessary?', 'Git, Node.js 24 with npm, Docker Desktop (for PostgreSQL 16) and Chrome for the end-to-end tests. All libraries are installed by npm from the lock files (section 4.1). Optional: a Gemini API key for the food scanner.'],
    ['3. How do the main components communicate?', 'The React website sends requests (HTTPS online) with a login token to the Express API under /api. The API checks the token and role, applies the business rules and reads or writes PostgreSQL through Prisma. Gemini is called only by the server (section 3).'],
    ['4. What steps must another developer follow?', 'Clone, copy the three .env.example files and fill them in, docker compose up -d, then in server: npm install, npx prisma migrate deploy, npm run db:seed, npm run dev; in client: npm install, npm run dev (section 4.3).'],
    ['5. What problems did you encounter?', 'An out-of-date README, missing setup details, a lint warning, a check-in bug found by the integration tests and new package advisories – all corrected (section 6.2).'],
    ['6. How did you verify the integrated system works?', 'A clean install from GitHub with R01–R06 all PASS, and 730 automated tests on the fresh copy, including 12 end-to-end tests that run browser, API and database together.'],
    ['7. What would happen if someone downloaded the repository today?', 'They get commit 70eddbf with the updated README. Following it gives a running app with demo data in a few minutes; all tests pass. npm reports the one remaining advisory of a build-time tool (counted 3 times, once per package that contains it; section 6.3).'],
    ['8. What improvements are still necessary before the final demonstration?', 'The peer installation test and user tests with real people, then their corrections; refreshing the online demo data before the demonstration; the Prisma update when it fixes the last advisory.'],
  ], { boldFirst: true, size: 18 }),

  // 9 ─────────────────────────────────────────────────────────────
  h1('9. Week 7 Student Report Sheet'),
  sheet([
    ['Student / ID', '____________________  /  ____________'],
    ['Project title', 'GymFlow – A Web-Based Gym Membership, Class Management and Workout Tracking System'],
    ['GitHub URL', REPO],
    ['Week 7 dates', '18–25 November 2026'],
    ['Topic', 'Reproducibility, Installation and Integration (Development Stage 5)'],
  ]),
  h2('9.1 Submission checklist'),
  ...bullets([
    '☑ Integrated project and updated GitHub repository',
    '☑ Updated README and step-by-step installation instructions',
    '☑ Dependency and configuration documentation',
    '☑ Reproducibility results and screenshots or terminal evidence (clean environment; peer test planned 26 Nov)',
    '☑ Development Stage 5 record and meaningful commit links',
    '☑ Updated report and answers to the questions',
  ]),

  // 10 ────────────────────────────────────────────────────────────
  h1('10. References'),
  ...list([
    'Node.js documentation – https://nodejs.org/docs/latest-v24.x/api/',
    'npm documentation: package-lock.json and npm ci – https://docs.npmjs.com/cli/commands/npm-ci',
    'Docker Compose documentation – https://docs.docker.com/compose/',
    'PostgreSQL 16 documentation – https://www.postgresql.org/docs/16/',
    'Prisma ORM documentation: Prisma Migrate (migrate deploy) – https://www.prisma.io/docs/orm/prisma-migrate',
    'Vite documentation: server options (proxy) – https://vite.dev/config/server-options',
    'Playwright documentation: web server for tests – https://playwright.dev/docs/test-webserver',
    'Vitest documentation – https://vitest.dev/guide/',
    'Render documentation – https://render.com/docs',
    'Neon documentation – https://neon.com/docs',
    'GitHub documentation: ignoring files – https://docs.github.com/en/get-started/git-basics/ignoring-files',
  ]),

  // 11 ────────────────────────────────────────────────────────────
  h1('11. Next Step'),
  ...list([
    '**Peer installation test (26 November):** a fellow student installs GymFlow from the README with docs/user-testing/peer-install-sheet.md; every question becomes a README correction.',
    '**User tests:** friends use the live site with the user-testing script (member, trainer, admin); their findings are fixed in Week 8.',
    '**Before the final demonstration:** refresh the online demo data and check the live site end to end.',
  ]),
];

writeDocument(buildDocument({ headerText: 'Weekly Progress Report – Week 7', title: 'GymFlow – Week 7 Report', children }), out);
