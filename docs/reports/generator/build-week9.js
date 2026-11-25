// Builds the Week 9 report, structured like the university's Week 9 guide
// ("Final demonstration and career presentation": final audit, report, demonstration, pitch, career materials,
// final package). Reads the recorded audit results from week-09-final-audit.json next to this file.
// usage: node build-week9.js <out.docx>   (needs week-09-final-audit.json and img/ next to this file)
const fs = require('fs');
const path = require('path');
const { p, lead, why, note, h1, h2, bullets, list, table, sheet, gap, code, fig, coverPage, buildDocument, writeDocument } = require('./report-lib');

const audit = JSON.parse(fs.readFileSync(path.join(__dirname, 'week-09-final-audit.json'), 'utf8'));
const out = process.argv[2] || 'week-09-report.docx';
const REPO = 'https://github.com/Yousifqayssar/gymflow';
const t = audit.tests;
const passCount = audit.useCase.filter((u) => u.status === 'PASS').length;

const children = [
  ...coverPage({ week: 9, stage: 'Final Demonstration and Career Presentation', date: audit.date, status: 'Final audit passed – final project report pending' }),

  // 1 ─────────────────────────────────────────────────────────────
  h1('1. Summary'),
  p('The key question of Week 9 is: **can I demonstrate what I personally engineered, explain my technical decisions and prove that the system works?** To answer it with evidence, the exact version that will be demonstrated was cloned from GitHub into an empty folder, installed with the README alone, and checked end to end: the main use case, every automated test suite, the security of files, history and the live website, the architecture against the code, and the live demo.'),
  p(`The final audit passed: ${passCount} of ${audit.useCase.length} use-case checks, ${t.server.passed}/${t.server.total} API tests, ${t.client.passed}/${t.client.total} screen tests and ${t.e2e.passed}/${t.e2e.total} end-to-end tests on the fresh copy, and no secret in any file, in the Git history or in the website. The demonstration plan, the technical pitch, a CV entry and a LinkedIn post were prepared from this evidence. Still open: the final project report (PDF), the peer and user tests, and refreshing the online demo data before the demonstration (section 8).`),
  lead('Key results'),
  table([4300, 4726], [
    ['Measure', 'Result'],
    ['Version audited', `${audit.commit} (GitHub, ${audit.date})`],
    ['Main use case on the fresh copy', `${passCount} / ${audit.useCase.length} PASS`],
    ['Automated tests on the fresh copy', `API ${t.server.passed}/${t.server.total} · screen ${t.client.passed}/${t.client.total} · end-to-end ${t.e2e.passed}/${t.e2e.total}`],
    ['Secrets', '0 in files, 0 in 131 commits, 0 in the built and live website'],
    ['Live demo', 'Running, security headers present, role checks work'],
    ['Package advisories', 'Website 0 · tests 0 · server 1 (build-time tool only, no fix available yet)'],
  ], { boldFirst: true }),

  // 2 ─────────────────────────────────────────────────────────────
  h1('2. The Six Final Tasks'),
  table([2300, 4726, 1100, 900], [
    ['Task', 'What was done', 'Section', 'Status'],
    ['1. Final technical audit', 'Fresh clone of the demonstrated version; use case, tests, installation, security, architecture, live site', '3', 'Done'],
    ['2. Finalize the report', 'Chapter plan ready (Week 8); final project report not yet written', '8', 'Partial'],
    ['3. Prepare the demonstration', '8-minute plan with live use case, backup and failure plan', '4', 'Done'],
    ['4. Technical pitch', '60–120 second pitch answering the roadmap questions', '5', 'Done'],
    ['5. Career materials', 'CV entry and LinkedIn draft based on verified work', '6', 'Done'],
    ['6. Final package', 'Checklist of the 13 deliverables with their location', '7', 'Partial'],
  ], { boldFirst: true, statusCol: 3, size: 18 }),

  // 3 ─────────────────────────────────────────────────────────────
  h1('3. Final Technical Audit'),
  h2('3.1 Test record'),
  sheet([
    ['Version', `${audit.commit} – ${REPO}/commit/${audit.commit.split(' ')[0]}`],
    ['Date', audit.date],
    ['Environment', audit.environment],
    ['Method', 'git clone into a new empty folder; only the README; new empty database; new random secrets; the main use case run by a script in Chrome (website) and against the API'],
    ['Adaptation', audit.adaptation],
  ]),
  h2('3.2 Installation and run'),
  table([3000, 4826, 1200], [
    ['Step', 'Actual result', 'Status'],
    ...audit.install.map((s) => [s.step, s.actual, s.status]),
  ], { boldFirst: true, statusCol: 2, size: 18 }),
  h2('3.3 Main use case – input to output'),
  p('A member books a class on the website, the server refuses a second booking, the front desk checks her in, a Basic member pays for a class with a declined and then a valid test card, and a member is refused an admin-only endpoint. Every check compares the expected result with what actually happened.'),
  table([600, 2700, 2200, 2626, 900], [
    ['ID', 'Check', 'Expected', 'Actual result', 'Status'],
    ...audit.useCase.map((u) => [u.id, u.check, u.expected, u.actual, u.status]),
  ], { boldFirst: true, size: 16, statusCol: 4 }),
  p(audit.useCaseNote),
  ...fig('audit-booked.png', 5.8, 'Audit U3 on the fresh copy: the class after tapping "Book this class" – "You\'re booked"'),
  ...fig('audit-check-in.png', 5.8, 'Audit U5 on the fresh copy: the front desk types the member number and GymFlow recognises the member'),
  h2('3.4 Automated tests'),
  table([2600, 2400, 2000, 2026], [
    ['Suite', 'Command', 'Result', 'Duration'],
    ['API tests (Vitest + Supertest)', 'server> npm test', `${t.server.passed} / ${t.server.total} pass (${t.server.files} files)`, t.server.duration],
    ['Screen tests (Vitest + Testing Library)', 'client> npm test', `${t.client.passed} / ${t.client.total} pass (${t.client.files} files)`, t.client.duration],
    ['Lint (oxlint)', 'client> npm run lint', t.lint, '–'],
    ['End-to-end tests (Playwright)', 'e2e> npm test', `${t.e2e.passed} / ${t.e2e.total} pass`, t.e2e.duration],
  ], { boldFirst: true, size: 18 }),
  code(audit.terminal),
  h2('3.5 Security'),
  table([3000, 5026, 1000], [
    ['Check', 'Actual result', 'Status'],
    ...audit.security.map((s) => [s.check, s.actual, s.status]),
  ], { boldFirst: true, size: 17, statusCol: 2 }),
  p(audit.securityNote),
  h2('3.6 GitHub, architecture and report'),
  table([3000, 5026, 1000], [
    ['Check', 'Actual result', 'Status'],
    ...audit.other.map((s) => [s.check, s.actual, s.status]),
  ], { boldFirst: true, size: 17, statusCol: 2 }),

  // 4 ─────────────────────────────────────────────────────────────
  h1('4. Demonstration Plan (8 minutes)'),
  p('The demonstration shows the working system, not slides. Two browser windows side by side: the member Elif on the left, the admin on the right. The full plan with the checklist for the day before is in the repository (docs/final/demo-plan.md).'),
  table([1300, 3200, 4526], [
    ['Time', 'Show', 'Key points'],
    ['0:00–1:00', 'Front page', 'The problem (paper cards, spreadsheets), the three users, the objective'],
    ['1:00–2:00', 'Architecture diagram', 'Browser → Express layers → PostgreSQL; one web service; transactions'],
    ['2:00–3:30', 'Elif books a class', 'Input: the tap. Processing: token, role, transaction with row lock, rules. Output: "You\'re booked". My own work in every layer.'],
    ['3:30–4:15', 'Admin checks Elif in', 'Membership and points at the desk; an expired member is refused with the reason'],
    ['4:15–5:00', 'Can pays for a class', 'Declined test card, then a valid one; never charged twice'],
    ['5:00–6:30', 'Code and tests', 'booking.service.js and a test; 3 test levels; challenge: food scanner 195 s → 9–19 s'],
    ['6:30–8:00', 'README', 'Limitations, future improvements, traceability'],
  ], { boldFirst: true, size: 18 }),
  p('**Backup:** if the free hosting is slow or the demo data has expired, the same flow runs on the laptop (local version) or is shown with the final screenshots, and the reason is said openly.'),

  // 5 ─────────────────────────────────────────────────────────────
  h1('5. Technical Pitch (60–120 seconds)'),
  table([3000, 6026], [
    ['Question', 'Answer (spoken in my own words)'],
    ['What problem did I solve, and who needs it?', 'Small gyms manage members with paper and spreadsheets; front-desk staff, trainers and members need one clear system.'],
    ['What did I personally build?', 'All of GymFlow: the React website and phone app, the Express API with the business rules, the PostgreSQL database, the tests and the hosting.'],
    ['Which technologies, and why?', 'React for a fast installable app; Express and Prisma for a clear layered API; PostgreSQL because bookings and payments need transactions and constraints.'],
    ['Hardest engineering challenge?', 'Making the rules unbreakable – no overbooking, no double charge – with transactions, row locks and database constraints, proven by tests with simultaneous requests.'],
    ['How did I test it?', '732 automated tests on three levels, a check of every endpoint against every role, and a clean install from GitHub that passed everything.'],
    ['What would I improve next?', 'A real payment provider for Turkey and reminders before a membership expires.'],
  ], { boldFirst: true, size: 18 }),

  // 6 ─────────────────────────────────────────────────────────────
  h1('6. Career Materials'),
  h2('6.1 CV-ready project entry'),
  p('**GymFlow – Gym Membership, Class Booking and Workout Tracking Web App** · Graduation project, Altınbaş University · 2026. Designed and built, as the sole developer, a full-stack web application for gyms: memberships and card payments, QR check-in, class booking with capacity rules, trainer workout plans and progress tracking for three roles.'),
  ...bullets([
    'Built a REST API (Node.js, Express, PostgreSQL, Prisma) with 61 endpoints; booking, membership and payment rules run in database transactions with row locks, and tests with simultaneous requests prove there is no overbooking, no overlapping membership and no double charge.',
    'Built a React website that works as an installable phone app, with dark mode and accessibility features.',
    'Verified the system with 732 automated tests, including an automatic check of every endpoint against every role.',
    `Deployed it online (Render + Neon) and proved it reproducible from the README on a fresh clone. GitHub: ${REPO}`,
  ]),
  h2('6.2 LinkedIn-ready project post (draft, not published)'),
  table([2400, 6626], [
    ['Part', 'Content'],
    ['Opening', 'Small gyms still run on paper cards, spreadsheets and messaging apps; members, trainers and front-desk staff all lose time.'],
    ['Solution and contribution', 'GymFlow – one app for three roles; built alone: React website that installs like an app, Node.js/Express API, PostgreSQL via Prisma, hosted on Render and Neon.'],
    ['Challenge and evidence', 'Making the rules impossible to break (last spot, double charge): transactions with row locks and constraints, tested with simultaneous requests; 732 automated tests; clean install from GitHub.'],
    ['Learning and next step', 'Measure before optimising: the food scanner took 195 s because of hidden retries; a time budget and fallback brought it to 9–19 s. Next: real payments, reminders.'],
    ['Links and visuals', 'GitHub and live demo links; the student-created architecture diagram; one final screenshot (demo data only).'],
  ], { boldFirst: true, size: 18 }),
  p('The full text of the post and the pitch is in docs/final/career-materials.md, with a table that links every claim to its evidence.'),

  // 7 ─────────────────────────────────────────────────────────────
  h1('7. Final Submission Package'),
  table([600, 3300, 3926, 1200], [
    ['#', 'Deliverable', 'Where', 'Status'],
    ['1', 'Final Graduation Project Report (PDF)', 'To be written from the Week 8 chapter plan', 'Not yet'],
    ['2', 'GitHub URL and supervisor access', `${REPO} (public)`, 'Done'],
    ['3', 'Complete source code', 'client/, server/, e2e/', 'Done'],
    ['4', 'Professional README', 'README.md', 'Done'],
    ['5', 'Final architecture diagrams', 'docs/diagrams/architecture.svg, er-diagram.md', 'Done'],
    ['6', 'At least five development-stage records', 'Weekly reports Weeks 2–8; docs/development-log.md', 'Done'],
    ['7', 'Testing evidence', 'Test suites; docs/reports/evidence/; traceability; this audit', 'Done'],
    ['8', 'Reproducibility instructions', 'README (verified Week 7 and again in this audit)', 'Done'],
    ['9', 'Final screenshots', 'docs/screenshots/ (12)', 'Done'],
    ['10', 'Demonstration material', 'docs/final/demo-plan.md; live demo; screenshots as backup', 'Done'],
    ['11', 'CV-ready project description', 'docs/final/career-materials.md (A); section 6.1', 'Done'],
    ['12', 'LinkedIn-ready project post', 'docs/final/career-materials.md (B); section 6.2', 'Done'],
    ['13', '60–120 second technical pitch', 'docs/final/career-materials.md (C); section 5', 'Done'],
  ], { boldFirst: true, size: 17, statusCol: 3 }),

  // 8 ─────────────────────────────────────────────────────────────
  h1('8. Remaining Work and Limitations'),
  ...bullets([
    '**Final project report (PDF):** the chapter plan from Week 8 (section 9 of that report) is ready; the report itself still has to be written and exported as PDF.',
    '**Peer installation and user tests:** prepared (peer-install-sheet.md, user-testing-script.md); results have not been received yet. Usability therefore stays "Not tested" in the traceability table.',
    `**Online demo data:** the live demo has classes only until ${audit.liveClassesUntil}. It must be refreshed shortly before the demonstration.`,
    '**Driver warning:** the pg database driver warns that Prisma 7 loads related records in parallel inside transactions; it will become an error in pg 9. Results are correct today and pg is locked to 8.23.1; to re-check when Prisma releases an update (section 3.6).',
    '**Known limitations of the system:** test payment gateway (no real money), food-scanner estimates not measured, camera scanning and real-phone installation not covered by automated tests, no full accessibility scan, one build-time npm advisory waiting for a Prisma update.',
  ]),

  // 9 ─────────────────────────────────────────────────────────────
  h1('9. Week 9 Student Report Sheet'),
  sheet([
    ['Student / ID', 'Yousif Al-Samrre  /  ____________'],
    ['Project title', 'GymFlow – A Web-Based Gym Membership, Class Management and Workout Tracking System'],
    ['GitHub URL', `${REPO} (public)`],
    ['Live demo', 'https://gymflow-bw46.onrender.com'],
    ['Week 9 date', audit.date],
  ]),
];

writeDocument(buildDocument({ headerText: 'Weekly Progress Report – Week 9', title: 'GymFlow – Week 9 Report', children }), out);
