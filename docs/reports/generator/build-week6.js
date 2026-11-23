// Builds docs/reports/week-06-report.docx, structured as the university's Week 6 guide asks
// (Testing and Validation). Test results come from evidence.json and retest.json (real runs).
// Usage: node build-week6.js <output.docx>
const fs = require('fs');
const path = require('path');
const L = require('./report-lib.js');
const { p, lead, why, note, h1, h2, bullets, list, table, sheet, gap, code, fig, coverPage, buildDocument, writeDocument } = L;

const evidence = JSON.parse(fs.readFileSync(path.join(__dirname, 'evidence.json'), 'utf8'));
const retest = JSON.parse(fs.readFileSync(path.join(__dirname, 'retest.json'), 'utf8'));
const REPO = 'https://github.com/Yousifqayssar/gymflow';
const commit = (hash) => `${hash} – ${REPO}/commit/${hash}`;
const passed = evidence.results.filter((r) => r.status === 'PASS').length;

const children = [
  ...coverPage({ week: 6, stage: 'Stage 4: Testing and Validation', date: '22 October 2026 (revised 23 November 2026)', status: 'Completed' }),

  // ---------------------------------------------------------------- 1
  h1('1. Summary'),
  p('Week 6 had one goal: show with systematic tests that GymFlow works correctly and safely. Four test levels were used: **API tests** for every endpoint and business rule, **screen tests** for the most important components, **end-to-end tests** that drive the whole app in a real browser, and **manual test cases** with recorded inputs and outputs. Security was tested at the same time: every endpoint is checked for login and role protection, and the server now sends security headers and limits login attempts.'),
  p('Five failures were found during the week. Each one was diagnosed, corrected, and the same test was run again (section 6). This revised report follows the structure of the university\'s Week 6 guide; all evidence in it was collected again on 23 November 2026 against the current code.'),
  table([5013, 4013], [
    ['Key result', 'Value'],
    ['Documented test cases (T01–T18)', `${passed} of ${evidence.results.length} PASS`],
    ['API tests (server)', `${retest.server.tests} passing, 0 failing`],
    ['Screen tests (client)', `${retest.client.tests} passing, 0 failing`],
    ['End-to-end tests (Chrome)', `${retest.e2e.tests} passing, 0 failing`],
    ['Endpoints checked for login and role protection', retest.routeProtection.summary],
    ['Failures found → fixed → retested', '5 → 5 → 5'],
    ['Known vulnerabilities (npm audit)', retest.audit],
  ], { boldLast: true }),

  // ---------------------------------------------------------------- 2
  h1('2. Features and Requirements Validated'),
  p('The tests cover the requirements from the project report (F = original requirement, E = extension, NFR = non-functional requirement):'),
  table([900, 4626, 3500], [
    ['ID', 'Requirement', 'Validated by'],
    ['F1', 'Register, log in, log out; role-based access', 'T01–T07, auth tests, route-protection test, e2e login'],
    ['F2', 'Membership plans; memberships with automatic dates', 'plans + memberships API tests'],
    ['F3', 'Membership status and expiring memberships', 'membershipStatus unit tests, member-list tests'],
    ['F4', 'Create, edit and cancel classes', 'classes API tests'],
    ['F5', 'Book and cancel classes with capacity rules', 'T17, bookings tests, BookingPanel screen tests, e2e booking'],
    ['F6', 'Check members in with a QR code or member number', 'T09–T11, check-in tests, CheckInPage screen tests, e2e check-in'],
    ['F7–F8', 'Exercises, workout plans, logged workouts, progress', 'exercises, workout-plans, workout-logs, progress tests'],
    ['F9', 'Admin dashboard numbers', 'gym-stats tests'],
    ['E2', 'Online card payments', 'T13–T16, payments + cardGateway tests, CardCheckout screen tests, e2e booking'],
    ['E4/E5', 'Basic/Premium; partner gyms; food scanner', 'T12, partner-gym-access, class-balance, nutrition tests'],
    ['NFR', 'Security: login, roles, headers, guessing', 'T04, T05, T08, T18, security + route-protection tests'],
    ['NFR', 'Usability of error messages', 'errorHandler unit test, e2e login (expired login)'],
  ], { boldFirst: true }),

  // ---------------------------------------------------------------- 3
  h1('3. Testing Strategy'),
  p('The methods were chosen for a web application with a server API, a database with business rules, and a browser interface. Methods that do not apply to GymFlow were not used.'),
  table([1700, 2300, 5026], [
    ['Method', 'Tool', 'Why it was chosen'],
    ['Unit', 'Vitest', 'Pure rules (dates in the gym time zone, membership status, points, card checks) are tested quickly and on their own.'],
    ['API / integration', 'Vitest + Supertest, PostgreSQL test database', 'Most rules live in the server and the database (capacity, no double booking, one visit per day). Testing through real HTTP requests against a real database tests them as they really run.'],
    ['Security', 'Supertest; automatic endpoint discovery', 'Every endpoint is found automatically and called without a token, with a forged token and with every wrong role. New endpoints are checked without updating a list.'],
    ['User interface (screen)', 'Vitest + Testing Library + jsdom', 'The booking panel, card form and check-in page contain the most user decisions; they are tested the way a user sees them.'],
    ['System / end-to-end', 'Playwright + Chrome', 'Proves that the whole deployed app (production build, server, database) works in a real browser on desktop and phone.'],
    ['Manual test cases', 'Recorded HTTP requests (T01–T18)', 'Gives readable evidence with input, expected and actual result for the most important requirements.'],
    ['Boundary', 'within API and manual tests', 'Edges such as capacity, expiry month 1–12, 3-digit CVC, the 10th/11th login attempt.'],
  ], { boldFirst: true, size: 19 }),
  gap(),
  p('**Not used:** hardware, sensor and machine-learning evaluation. GymFlow has no hardware or sensors; the food scanner uses Google\'s AI model as an external service, so it was evaluated by its response time and its error handling, not by model accuracy (section 10).'),

  // ---------------------------------------------------------------- 4
  h1('4. Test Cases and Evidence'),
  p('Each case below was run against the production build of GymFlow (server in production mode, port 4300, demo data). Inputs include **normal**, **invalid** and **boundary** values. The "Actual result" column is the real response of the server, recorded by a script on ' + new Date(evidence.ranAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }) + '.'),
  table([540, 1000, 1450, 1560, 1650, 2126, 700], [
    ['ID', 'Req.', 'Component / objective', 'Input', 'Expected result', 'Actual result', 'Status'],
    ...evidence.results.map((r) => [r.id, r.req.replace(/, rule:.*/, ' + rule').replace(' (boundary)', ' boundary'), r.component, r.input, r.expected, r.actual, r.status]),
  ], { size: 16, statusCol: 6, boldFirst: true }),
  note(`Result: ${passed} of ${evidence.results.length} test cases passed. T18 was run on a freshly started server, because the earlier wrong passwords (T01, T03) already count towards the limit.`),
  ...fig('login-blocked.png', 5.2, 'T18 in the app: after 10 wrong passwords even the correct password is refused for 15 minutes.'),
  ...fig('checkin-partner.png', 5.2, 'T12 in the app: a Basic member is refused at a partner gym, with the reason.'),

  h2('4.1 Automated test suites'),
  table([1600, 2500, 1100, 3826], [
    ['Level', 'Tool', 'Tests', 'What it proves'],
    ['API', 'Vitest + Supertest', `${retest.server.tests}`, 'Every endpoint and business rule against a real test database'],
    ['Screens', 'Vitest + Testing Library', `${retest.client.tests}`, 'Components behave correctly for the user'],
    ['End-to-end', 'Playwright + Chrome', `${retest.e2e.tests}`, 'The whole deployed app works in a real browser (desktop and phone)'],
  ], { boldFirst: true }),
  gap(),
  code(retest.outputLines),
  note('The original Week 6 run (22 October 2026) gave 675 API, 29 screen and 9 end-to-end tests, all passing. The numbers above are from the re-run on 23 November 2026, which includes tests added in Week 7.'),

  // ---------------------------------------------------------------- 5
  h1('5. Proof That the Tests Can Fail'),
  p('A test only proves something if it fails when the code is wrong. To check this, the role check in authorize() was switched off on purpose, and the route-protection test was run again:'),
  table([4513, 4513], [
    ['Situation', 'Route-protection test result'],
    ['Role check switched off (deliberate fault)', retest.mutation.broken],
    ['Role check restored', retest.mutation.restored],
  ], { boldLast: true }),
  gap(),
  p('Every endpoint that should refuse a wrong role was reported, so the test really detects a missing permission check.'),

  // ---------------------------------------------------------------- 6
  h1('6. Failures, Diagnosis, Correction and Retest'),
  p('Each failure found in Week 6 is recorded as failure → diagnosis → correction → retest, with the bug-fix commit.'),
  ...retest.failures.flatMap((f) => [
    h2(`${f.id} – ${f.title}`),
    sheet([
      ['Failure observed', f.failure],
      ['Diagnosis', f.diagnosis],
      ['Correction', f.correction],
      ['Retest', f.retest],
      ['Status', f.status],
      ['Bug-fix commit', commit(f.commit)],
    ]),
    gap(),
  ]),
  ...fig('session-ended.png', 4.6, 'D4 after the fix: a login that stopped working ends politely instead of showing a technical error.'),
  ...fig('food-busy.png', 4.6, 'D2 after the fix: when Google\'s AI service is overloaded the member sees a calm message and "Try again".'),

  // ---------------------------------------------------------------- 7
  h1('7. Development Stage 4 – Testing and Correction'),
  sheet([
    ['Date and objective', '22 October 2026. Objective: prove that GymFlow\'s features and rules work, that every endpoint is protected, and that the app is safe against common attacks. Evidence re-collected on 23 November 2026.'],
    ['Functionality and technical decision', 'Tested: login and roles, memberships, classes and booking, check-in, payments, partner gyms, food scanner, security headers and the login limit. Vitest + Supertest against a real PostgreSQL test database (the rules live in the server and database); Playwright with the installed Chrome against the production build (tests what is really deployed); a separate e2e database so real data is never touched.'],
    ['Problem and solution', 'Five failures (D1–D5): map tiles blocked by the service worker, food scanner taking minutes, a hidden error message, a raw "invalid token" error, and login tests blocked by the new limit. All diagnosed, corrected and retested – see section 6.'],
    ['Evidence and GitHub commit', `Test cases T01–T18 (section 4), test outputs (section 4.1), figures 1–4. Commits: 8d38aaa, 9de9ea5, 0bcfbec, 5e02f02, c620fa8, 7608678, 2bb6480 – ${REPO}/commits/main`],
    ['Next step', 'Week 7 – reproducibility, installation and integration: another developer must be able to install, run and test GymFlow from the documented instructions.'],
  ]),

  // ---------------------------------------------------------------- 8
  h1('8. Testing Methodology'),
  h2('8.1 Approach'),
  p('Testing followed the test pyramid: many fast API and unit tests for the rules, fewer screen tests for important components, and a small number of end-to-end tests for complete user journeys. Business rules are tested at the level where they are enforced – mostly the server and database – so a test failure points directly to the broken rule.'),
  h2('8.2 Environment'),
  table([3000, 6026], [
    ['Item', 'Version / setting'],
    ['Operating system', 'Windows 11'],
    ['Runtime', 'Node.js 24.12'],
    ['Database', 'PostgreSQL 16.15 in Docker; separate databases gymflow_test (API tests) and gymflow_e2e (end-to-end)'],
    ['Server tests', 'Vitest 5.0.3, Supertest 7'],
    ['Screen tests', 'Vitest 5.0.3, React Testing Library 16.3.3, jsdom 30.1.2'],
    ['End-to-end tests', 'Playwright 1.64.0 with the installed Google Chrome; desktop and Pixel 7 phone profiles'],
    ['App under test', 'Production build, server in production mode on port 4300'],
  ], { boldFirst: true }),
  h2('8.3 Test-case design'),
  ...bullets([
    '**Normal inputs:** the everyday path (correct login, valid membership, a free place in a class).',
    '**Invalid inputs:** wrong password, malformed email, card number with a typo, forged token, wrong role.',
    '**Boundary values:** expiry month 13, a 2-digit CVC, a full class, the 11th login attempt, a second check-in on the same day, a membership that ended yesterday.',
    '**IDs and traceability:** each documented case has an ID (T01–T18) and the requirement it checks; each automated test file is named after its feature.',
    '**Independence:** every API test starts from an empty test database; every end-to-end run starts from fresh demo data.',
  ]),

  // ---------------------------------------------------------------- 9
  h1('9. Validation and Testing Results'),
  h2('9.1 How the tests support the requirements'),
  p('All original requirements F1–F9 and the extensions used in Week 6 have at least one automated test and, for the most important ones, a documented test case (section 2). The security requirement is covered from three sides: the automatic route-protection test (every endpoint), the documented cases T04–T08 and T18, and the end-to-end login tests.'),
  h2('9.2 Results'),
  table([3400, 1400, 1400, 2826], [
    ['Test set', 'Run', 'Passed', 'Failed'],
    ['Documented test cases', `${evidence.results.length}`, `${passed}`, `${evidence.results.length - passed}`],
    ['API tests', `${retest.server.tests}`, `${retest.server.tests}`, '0'],
    ['Screen tests', `${retest.client.tests}`, `${retest.client.tests}`, '0'],
    ['End-to-end tests', `${retest.e2e.tests}`, `${retest.e2e.tests}`, '0'],
  ], { boldFirst: true }),
  gap(),
  p('Expected and actual results matched in every documented case. During the first evidence runs some cases did not match, and in every one the mistake was in the test script, not in GymFlow: an expected status of 200 where the server correctly answers 201 Created, a wrong field name for the card holder, a demo member whose membership had already ended, and earlier wrong passwords that already counted towards the login limit. The script was corrected and all cases were run again.'),
  h2('9.3 Remaining limitations'),
  ...bullets([
    '**Real phones:** the phone layout is tested in Chrome\'s Pixel 7 profile; the test on real phones is carried out by the student with the S6 checklist.',
    '**Camera:** the QR camera cannot run in automated tests; scanning is tested with member numbers and with a simulated scan.',
    '**Payments:** a test gateway with test card numbers is used; no real bank is involved.',
    '**Load:** no load or stress testing – GymFlow is designed for one gym.',
    '**AI accuracy:** the calories of the food scanner are estimates from Google\'s model and were not measured against real values.',
    '**New package advisories:** the audit was clean on 22 October. The re-check on 23 November found 6 advisories in the server packages (4 high, 2 moderate), all published after Week 6: body-parser and qs are part of Express and run in the live server (fixable with npm audit fix); effect and fast-uri are only used by the Prisma command-line tool when building. They are planned for the next week.',
  ]),

  // ---------------------------------------------------------------- 10
  h1('10. Experimental Results'),
  table([3300, 2863, 2863], [
    ['Measurement', 'Before', 'After'],
    ['Food scanner: time for one photo', 'up to 195 s, then an error', '9–19 s on the live site (limit 30 s)'],
    ['Wrong logins before blocking (per address, 15 min)', 'unlimited', '10, then 429'],
    ['Endpoints without a protection check', 'not measured', `0 (${retest.routeProtection.summary})`],
    ['Known vulnerable packages (npm audit)', 'advisories in prisma and vite', '0 on 22 Oct; re-check 23 Nov: client 0, e2e 0, server 6 new (see 9.3)'],
  ], { boldFirst: true }),
  gap(),
  p('The food-scanner times were measured on the live site on 22 October 2026 with real meal photos. The cause of the long times and the fix are in D2.'),

  // ---------------------------------------------------------------- 11
  h1('11. Commit History (Week 6)'),
  table([1300, 5226, 2500], [
    ['Commit', 'Message', 'Type'],
    ['8d38aaa', 'feat(server): add security headers and rate limit login attempts', 'feature + fix D1, D5'],
    ['9de9ea5', 'test(server): check every endpoint for login and role protection', 'tests'],
    ['0bcfbec', 'chore: update prisma and vite to fix audit warnings', 'security'],
    ['5e02f02', 'test(client): add screen tests for booking, checkout and check-in', 'tests'],
    ['c620fa8', 'test: add Playwright end-to-end tests for the main user flows', 'tests'],
    ['7608678', 'fix: food scanner time limit, fallback model and readable error messages', 'bug fix D2, D3'],
    ['1b81528', 'feat: make partner gyms part of Premium with location-aware map and check-in', 'feature'],
    ['2bb6480', 'fix(client): log out politely when a saved login stops working', 'bug fix D4'],
  ], { mono: [0] }),
  note(`Repository: ${REPO} (private – access can be given to the supervisor).`),

  // ---------------------------------------------------------------- 12
  h1('12. Week 6 Student Report Sheet'),
  sheet([
    ['Student / ID', '______________________________'],
    ['Project title', 'GymFlow – A Web-Based Gym Membership, Class Management and Workout Tracking System'],
    ['GitHub URL', REPO],
    ['Week 6 dates', 'Work completed 22 October 2026; evidence re-collected 23 November 2026'],
  ]),
  h2('12.1 Short testing summary'),
  sheet([
    ['Features tested / requirements checked', 'Login and roles (F1), memberships (F2–F3), classes and booking (F5), check-in (F6), workouts and progress (F7–F8), dashboard (F9), payments (E2), Basic/Premium and partner gyms (E4–E5), security (NFR).'],
    ['Testing methods and justification', 'Unit and API tests against a real test database (rules live in server and database); automatic security test over every endpoint; screen tests for the components with most user decisions; end-to-end tests in Chrome on the production build; 18 documented manual test cases with normal, invalid and boundary inputs.'],
    ['Key results, failures and corrections', `${passed}/${evidence.results.length} test cases, ${retest.server.tests} API, ${retest.client.tests} screen and ${retest.e2e.tests} end-to-end tests pass. Five failures (D1–D5) were diagnosed, corrected and retested; the route-protection test was shown to fail when the role check is switched off.`],
    ['Links to evidence and bug-fix commits', `Sections 4–6 of this report. Bug fixes: ${REPO}/commit/8d38aaa, ${REPO}/commit/7608678, ${REPO}/commit/2bb6480`],
  ]),
  h2('12.2 Submission checklist'),
  ...bullets([
    '☑ Testing strategy appropriate to the project (section 3)',
    '☑ Meaningful tests implemented or performed (sections 4–5)',
    '☑ Test evidence with expected and actual results, and pass/fail status (section 4)',
    '☑ Development Stage 4 record – Testing and Correction (section 7)',
    '☑ Updated Graduation Project Report: Testing / Results sections (sections 8–10)',
    '☑ GitHub bug-fix commits and current repository updates (section 11)',
  ]),
  h2('12.3 Supervisor review questions'),
  table([3300, 5726], [
    ['Question', 'Answer'],
    ['How do you know that your software works correctly?', `Four test levels pass: ${retest.server.tests} API, ${retest.client.tests} screen and ${retest.e2e.tests} end-to-end tests, plus ${evidence.results.length} documented cases with recorded actual results.`],
    ['Which test provides evidence for one important requirement?', 'F5 "no double booking": T17 books the same class twice – the first request gets 201, the second 409 "You have already booked this class". bookings.test.js checks the same rule through the API, and classes-database.test.js proves the database itself refuses a second booking.'],
    ['What happened when a test failed, and what did you change?', 'Example D4: refreshing the demo data made old logins invalid and the app showed "Invalid or expired token". The API client now ends the session politely and returns the user to the same page; the client and end-to-end tests were run again and pass.'],
    ['Where can you show the tests, results and commits?', `server/tests, client/src/**/*.test.jsx and e2e/tests in ${REPO}; results in sections 4–6; commits in section 11.`],
    ['Which parts still need validation before Week 7?', 'The test on real phones (S6, carried out by the student) and short sessions with real users.'],
  ], { boldFirst: true, size: 19 }),

  // ---------------------------------------------------------------- 13
  h1('13. Next Step'),
  p('**Week 7 – Reproducibility, Installation and Integration:** update the README so that another developer can install, run and test the whole project from the instructions alone (database in Docker, environment variables, demo data, the three test suites), and check this on a clean setup.'),
];

const out = process.argv[2] || path.join(__dirname, 'week-06-report.docx');
writeDocument(buildDocument({ headerText: 'Weekly Progress Report – Week 6', title: 'GymFlow – Weekly Progress Report – Week 6', children }), out);
