// Builds the Week 8 report, structured like the university's Week 8 guide
// ("Report completion and professional GitHub portfolio": six tasks, technical evidence, README, repository,
// weekly progress log, supervision questions, submission list).
// usage: node build-week8.js <out.docx>   (needs img/ next to this file)
const { p, lead, why, note, h1, h2, bullets, list, table, sheet, gap, code, fig, coverPage, buildDocument, writeDocument } = require('./report-lib');

const out = process.argv[2] || 'week-08-report.docx';
const REPO = 'https://github.com/Yousifqayssar/gymflow';
const link = (hash) => `${REPO}/commit/${hash}`;

const children = [
  ...coverPage({ week: 8, stage: 'Report Completion and Professional GitHub Portfolio', date: '25 November 2026', status: 'In progress – project report chapters planned' }),

  // 1 ─────────────────────────────────────────────────────────────
  h1('1. Summary'),
  p('The key question of Week 8 is: **can an instructor, developer or recruiter understand what I built, how it works and how I verified it, by reading my report and my GitHub repository?** This week the repository was turned into a professional portfolio: every requirement was traced to its code and tests, the architecture diagram was redrawn to match the final system, final screenshots of the main workflow were taken, the README was rewritten with the structure the guide asks for, the repository was checked and made public, and the public front page of the app was polished and made smoother to scroll.'),
  p('The traceability check was done honestly: of 22 requirements and quality goals, **16 pass, 5 are partial and 1 is not tested yet** (usability – user tests are planned for 26 November). The completion of the large project report was planned chapter by chapter but not yet written; it moves to the start of Week 9 (section 9).'),
  lead('Key results'),
  table([4300, 4726], [
    ['Measure', 'Result'],
    ['Requirements traced to code and tests', '22 – 16 Pass · 5 Partial · 1 Not tested'],
    ['Final architecture diagram', 'Redrawn; 6 changes since the original design explained'],
    ['Final screenshots', '12 (main workflow, admin, phone), 560 kB in total'],
    ['README', 'Rewritten with the guide\'s 17 sections; reference pages for the API and business rules'],
    ['Repository', 'Public; no clutter; secrets never committed; install order re-tested on a fresh clone'],
    ['Automated tests', 'API 685 · screen 33 · end-to-end 14 (2 new) – all pass'],
    ['Front page scrolling (simulated phone)', '1.7% slow frames at normal speed, with scroll animations'],
  ], { boldFirst: true }),

  // 2 ─────────────────────────────────────────────────────────────
  h1('2. The Six Week 8 Tasks'),
  table([2200, 4626, 1300, 900], [
    ['Task', 'What was done', 'Section', 'Status'],
    ['1. Complete the report', 'Chapter plan for the project report following the guide\'s list; content collected (traceability, diagram, screenshots, evidence)', '9', 'Partial'],
    ['2. Verify technical consistency', 'Traceability table: requirement → implementation → evidence → actual status', '3', 'Done'],
    ['3. Finalize visual evidence', 'Final architecture diagram (SVG) with explanation; 12 final screenshots', '4, 5', 'Done'],
    ['4. Professional README', 'Rewritten with Overview, Problem, Objectives, Architecture, Usage, Limitations, Authors, References …', '6', 'Done'],
    ['5. Organize GitHub', 'Clutter and secret check, fresh-clone install check, repository made public', '7', 'Done'],
    ['6. Prepare for Week 9', 'Front page polished; remaining gaps listed; demonstration plan', '8, 10', 'Done'],
  ], { boldFirst: true, statusCol: 3, size: 18 }),
  note('Status "Partial" (orange): the project report itself still has to be updated (section 9).'),

  // 3 ─────────────────────────────────────────────────────────────
  h1('3. Technical Consistency – Requirements Traceability'),
  p('Every requirement from the project report (F1–F9 original, E1–E6 extensions) and every quality requirement was checked against the real code and the real tests. "Pass" is used only when tests that pass prove the requirement; anything simplified or unproven is "Partial" or "Not tested". The full table with file names is in the repository: docs/traceability.md.'),
  table([700, 3100, 3726, 1500], [
    ['ID', 'Requirement', 'Evidence (tests)', 'Status'],
    ['F1', 'Register, log in, roles', 'auth, middleware, security; route-protection (197 checks); e2e login (5); T01–T08', 'Pass'],
    ['F2', 'Plans; memberships with automatic dates', 'plans, memberships, users, unit/dates', 'Pass'],
    ['F3', 'Membership status, expiring soon', 'unit/membershipStatus, my-membership, users', 'Pass'],
    ['F4', 'Create, edit, cancel classes', 'classes, classes-database', 'Pass'],
    ['F5', 'Book and cancel with capacity rules', 'bookings, classes-database, BookingPanel (8); e2e booking (2); T17', 'Pass'],
    ['F6', 'Check-in by QR code or member number', 'check-ins, check-ins-database, CheckInPage (9); e2e check-in; T09–T12', 'Partial – real camera not in automated tests'],
    ['F7', 'Exercise library, workout plans', 'exercises, workout-plans (API)', 'Pass'],
    ['F8', 'Log workouts, progress charts', 'workout-logs, progress, unit/progress (API)', 'Pass'],
    ['F9', 'Dashboard with key numbers', 'gym-stats, gym-admin-dashboard, MonthlyRevenueBars', 'Pass'],
    ['E1', 'Loyalty points, levels, discounts', 'unit/points, check-ins, me-qr-visits, memberships', 'Pass'],
    ['E2', 'Card payments, receipts', 'payments, class-payments, cardGateway, CardCheckout; e2e; T13–T16', 'Partial – test gateway, no real money'],
    ['E3', 'Attendance QR, no-show penalty', 'attendance (20)', 'Pass'],
    ['E4', 'Basic / Premium, pay per class', 'class-balance, class-payments, partner-gym-access', 'Pass'],
    ['E5', 'Body check-ins, map, food scanner', 'body, partner-gyms, nutrition (Gemini replaced by a stand-in)', 'Partial – AI accuracy not measured'],
    ['E6', 'Phone layout, installable app', 'e2e phone layout', 'Partial – install on a real phone not tested'],
    ['NFR', 'Security', 'Mutation check: 80 of 197 checks fail with the role check off; T18; history free of secrets', 'Pass'],
    ['NFR', 'Reliability · responsiveness · performance · portability', '732 automated tests; e2e phone; scanner 195 s → 9–19 s; fresh install R01–R06', 'Pass'],
    ['NFR', 'Accessibility', 'Code review; contrast test ≥ 4.5 : 1', 'Partial – no full WCAG scan'],
    ['NFR', 'Usability', 'User-testing script ready', 'Not tested – 26 Nov'],
  ], { boldFirst: true, size: 16, statusCol: 3 }),
  why('the guide asks to "record unmet requirements rather than claiming success". Writing down what is only partial gives the supervisor a true picture and gives Week 9 a clear list of what to test or explain.'),

  // 4 ─────────────────────────────────────────────────────────────
  h1('4. Final Architecture Diagram'),
  p('The architecture diagram was drawn again to match the integrated system (Figure 1). Parts of the original Week 1–3 design have a solid outline; parts added during development have a dashed green outline, so the comparison the guide asks for is visible in the diagram itself. The source is a text file (docs/diagrams/architecture.svg), so it can be read and changed like code.'),
  ...fig('architecture.png', 6.3, 'Final architecture of GymFlow: browser, web service with its layers, database, external services, build and deployment'),
  table([2800, 3226, 3000], [
    ['Original design', 'Final system', 'Why'],
    ['React → Express → PostgreSQL as separate parts', 'Same layers; online one web service sends website and API', 'One address: no cross-site requests online; one free service'],
    ['Database only in Docker', 'Docker locally, Neon online; same 18 migrations', 'Free managed database for the live demo'],
    ['Routes → controllers → services → Prisma', 'Unchanged + security layer in front', 'Week 6 security review'],
    ['Desktop website', 'Installable app with phone layout', 'Members use GymFlow at the gym on their phones'],
    ['No outside services', 'Google Gemini (server only), OpenStreetMap tiles', 'Food scanner and partner-gym map'],
    ['Check-in by member number', 'Camera QR scanner for check-in and attendance', 'Faster check-in; proof of attendance'],
  ], { boldFirst: true, size: 17 }),
  p('The core of the original design – the same layers for every feature inside the server – did not change; every new feature was added as a route, controller and service in the same pattern.'),

  // 5 ─────────────────────────────────────────────────────────────
  h1('5. Final Screenshots – the Main Workflow'),
  p('The screenshots were taken on 25 November from the running application with freshly loaded demo data (no real personal data). They follow the main use case from input to output: a visitor sees the front page (Figure 2), the member Elif opens a class and books it (Figures 3 and 4), and the front desk checks her in (Figure 5). Figure 6 shows the admin dashboard and Figure 7 the same app on a phone.'),
  ...fig('w8-01-front-page.png', 6.0, 'Public front page: what GymFlow offers, with the real app on a phone, and the Join / Log in buttons'),
  ...fig('w8-03-class-detail.png', 6.0, 'Input – a class before booking: 16 of 20 spots left, what to bring, health notes and the "Book this class" button'),
  ...fig('w8-04-class-booked.png', 6.0, 'Output – the same class after tapping "Book this class": "You\'re booked", a cancel option and a confirmation message'),
  ...fig('w8-07-check-in-desk.png', 6.0, 'Check-in desk: the member number was typed; GymFlow recognises Elif and shows her membership – here "Already checked in today", because the demo data already contains her visit of this morning'),
  ...fig('w8-06-admin-dashboard.png', 6.0, 'Admin dashboard: members by status, revenue this month and the class attendance rate of the last 30 days'),
  ...fig('w8-phone-pair.png', 4.2, 'The member app on a phone: home screen and the personal QR code used at the entrance'),

  // 6 ─────────────────────────────────────────────────────────────
  h1('6. Professional README'),
  p('The README is the entry point of the portfolio. It was rewritten with the sections the guide lists, so a person who has never seen GymFlow can understand its purpose, install it and check its main functions.'),
  table([2600, 6426], [
    ['README section', 'Content'],
    ['Project Overview, Problem, Objectives', 'What GymFlow is, the gym problem it solves, five objectives'],
    ['Main Features', 'Nine feature areas and what each role can do – only features that really exist'],
    ['Architecture', 'The final diagram and how one request travels through the layers'],
    ['Technology Stack', 'Each technology with the tested version and what it is used for in GymFlow'],
    ['Installation, Configuration, Running', 'The Week 7 verified steps; a settings table; expected output; common problems'],
    ['Running Tests', 'Three test levels, commands, numbers and duration; link to the traceability table'],
    ['Usage', 'Demo accounts and an example workflow: book a class, check in, pay with a test card'],
    ['Screenshots / Demo', 'Live demo link and 8 captioned screenshots'],
    ['Repository Structure', 'What each folder contains'],
    ['Known Limitations, Future Improvements', 'Implemented features clearly separated from plans'],
    ['Authors, References', 'Author and supervisor; official documentation; photo credits'],
  ], { boldFirst: true, size: 18 }),
  p('To keep the README readable, the 61-endpoint API reference and the detailed business rules moved to their own pages (docs/api.md, docs/business-rules.md), linked from the README. Long reference parts (common problems, all scripts, deployment) are folded sections that open with one click.'),

  // 7 ─────────────────────────────────────────────────────────────
  h1('7. GitHub Repository'),
  table([3000, 6026], [
    ['Check', 'Result'],
    ['Clutter', '460 tracked files; no temporary, backup, log or test-output files. Unused-looking avatar files checked: loaded by pattern (import.meta.glob), so in use.'],
    ['Secrets', 'All .env files (local, test, Neon, Render) ignored; the whole history contains only placeholders (Week 7 check).'],
    ['Instructions still work', 'Fresh clone of commit 52f9327 without any settings file: npm install in server and client finished without errors (the README now installs packages before configuring).'],
    ['Access', 'Repository made public on 25 November; README, diagram and screenshots load without logging in.'],
    ['Privacy note', 'Commits carry the author\'s e-mail address; this was explained before the repository was made public.'],
    ['Organisation', 'docs/ holds diagrams, screenshots, reports with evidence and generators, user testing, API, business rules, traceability and the development log.'],
  ], { boldFirst: true, size: 18 }),
  h2('7.1 Commits of the week'),
  table([1100, 1000, 6926], [
    ['Commit', 'Date', 'Message'],
    ['a69f78a', '24 Nov', 'feat(client): polish the public front page with real app screens, classes, map and FAQ'],
    ['8d9e84a', '24 Nov', 'feat(client): add a way back to the front page from login and join'],
    ['70eddbf', '24 Nov', 'perf(client): smoother front page scrolling with lightweight scroll animations'],
    ['3f55052', '25 Nov', 'docs: rebuild week 7 report to the university reproducibility guide'],
    ['cce9b89', '25 Nov', 'docs: add requirements traceability table'],
    ['b4fc4d1', '25 Nov', 'docs: add final architecture diagram and final screenshots'],
    ['52f9327', '25 Nov', 'docs: rewrite README as a professional project overview'],
  ], { mono: [0], size: 18 }),
  p(`Each commit: ${REPO}/commit/<id>`),

  // 8 ─────────────────────────────────────────────────────────────
  h1('8. Front Page Polish and Smooth Scrolling'),
  p('Before the final demonstration the public front page (/welcome) was finished. It now shows the real app on a phone, the eight class types with their photos, real app screens of workouts, progress, food scanner and rewards, the partner gyms on a small map of Istanbul, and five questions answered as the app really works. The made-up perk "free intro session with a trainer" was removed because GymFlow has no such feature. Visitors can now go back to the front page from the login and join pages.'),
  h2('8.1 Problem: unreadable button in dark mode'),
  sheet([
    ['Issue', 'The closing "Join GymFlow" button had white text on a white background in dark mode (contrast 1.23 : 1).'],
    ['Diagnosis', 'The button combined a Button variant with extra colour classes. Two Tailwind classes for the same property do not override each other by their order in the class list, so dark mode used the variant\'s light text colour.'],
    ['Solution', 'Buttons on dark and green backgrounds got their own complete class lists; later the button was made dark at the user\'s request.'],
    ['Retest', 'New end-to-end test measures the contrast (≥ 4.5 : 1, WCAG AA). With the old code the test fails (1.23); with the fix it passes. 14 of 14 end-to-end tests pass.'],
    ['Commit', `a69f78a – ${link('a69f78a')}`],
  ]),
  h2('8.2 Problem: scrolling not smooth, then scroll animations'),
  p('The user reported that scrolling the front page did not feel smooth and asked for content that appears while scrolling. Every version was measured by scrolling the whole page in Chrome with the processor slowed down four times (like a phone) and counting frames slower than 20 ms:'),
  table([5626, 3400], [
    ['Version', 'Slow frames (desktop / phone)'],
    ['Before, no animations', '1.0% / 0.1%'],
    ['Animations with the Motion library (JavaScript every frame)', '24.6% / 20.1%'],
    ['CSS transitions started by an IntersectionObserver', '11.5% / 8.3%'],
    ['… class added directly, without a React update', '8.8% / –'],
    ['… 15 blocks instead of 29 single items (final)', '5.4% / 2.7%'],
    ['Final, at normal reading speed', '4.3% / 1.7%'],
  ], { boldFirst: true }),
  p('Chrome\'s long-animation-frame report showed 0 ms of page script while scrolling, so the remaining cost was painting, not code; fewer, larger animated blocks helped most. The blurred menu bar (recalculated every frame) was replaced by a solid one, and the hero photo is saved brighter instead of being brightened by a CSS filter. Two ideas that did not help (will-change, keeping layers) were measured and not used. Commit 70eddbf.'),

  // 9 ─────────────────────────────────────────────────────────────
  h1('9. Project Report – Chapter Plan'),
  p('The guide asks to complete the report that has been developed since Week 1 rather than start a new one. The current version (project-report-weeks-1-5.docx) covers Weeks 1–5. Its update was planned this week and is the first task of Week 9:'),
  table([3000, 6026], [
    ['Chapter', 'Content and source'],
    ['Abstract', 'Problem, solution and results on half a page'],
    ['1. Introduction', 'Problem, motivation, users, objectives, scope (existing chapter 2, updated)'],
    ['2. Background and related work', 'Existing gym software; REST, OWASP, WCAG and usability testing as the basis of design decisions (new, verified sources only)'],
    ['3. Requirements', 'F1–F9, E1–E6, quality requirements, constraints, unfinished items (traceability, section 3)'],
    ['4. Methodology and architecture', 'Way of working, final diagram, data flow, technology choices, database'],
    ['5. Implementation and development stages', 'Important modules, decisions, challenges; Stages 1–5 records'],
    ['6. Testing and results', 'Methods, T01–T18, traceability, fresh install, performance, failures and corrections, user tests'],
    ['7. Limitations · 8. Conclusion and future work', 'From the traceability table and the README'],
    ['References', 'Checked sources only'],
  ], { boldFirst: true, size: 18 }),

  // 10 ────────────────────────────────────────────────────────────
  h1('10. Weekly Progress Log'),
  sheet([
    ['Week 8 dates', '24–25 November 2026'],
    ['Updated sections', 'README (rewritten), docs/traceability.md, docs/diagrams/architecture.svg + .md, docs/screenshots/ (12), docs/api.md, docs/business-rules.md, front page'],
    ['Key commits', 'a69f78a, 8d9e84a, 70eddbf, cce9b89, b4fc4d1, 52f9327 (section 7.1)'],
    ['Tests and reproducibility', 'Tests: server/tests, client/src/**/*.test.jsx, e2e/tests – 685 + 33 + 14 pass. Evidence: docs/reports/evidence/ (Week 6 test cases, Week 7 fresh install).'],
    ['Remaining limitations', 'Test payment gateway; AI estimates not measured; camera and phone installation not tested automatically; no full WCAG scan; usability not yet tested with users; project report not yet updated.'],
    ['Week 9 plan', '1. Update the project report (section 9). 2. User tests and peer installation (26 Nov) – add real results. 3. Refresh the online demo data and rehearse the main use case. 4. Final corrections only.'],
  ], [2600, 6426]),

  // 11 ────────────────────────────────────────────────────────────
  h1('11. Supervision Questions'),
  table([3000, 6026], [
    ['Question', 'Answer'],
    ['1. What did you personally implement?', 'The whole system: database design and migrations, the Express API with its security and business rules, the React website and phone app, the test suites on three levels, the hosting, and the documentation. Google Gemini, OpenStreetMap and the open-source libraries are used, not written.'],
    ['2. How does your architecture match your code?', 'Each box of the diagram is a folder: routes/, validation/, middleware/, controllers/, services/ and the Prisma client in server/src; pages/, components/ and api/ in client/src. Section 4 lists what changed since the original design and why.'],
    ['3. Which test results support your claims?', 'The traceability table (section 3) links every requirement to the tests that prove it; 685 API, 33 screen and 14 end-to-end tests pass; T01–T18 (Week 6) and R01–R06 (Week 7) record real outcomes.'],
    ['4. Can another developer run your project?', 'Yes: a fresh clone from GitHub installs and runs with the README alone (Week 7, R01–R06 all pass; install order re-checked this week). A peer test is planned for 26 November.'],
    ['5. What limitations remain?', 'Test payment gateway, unmeasured AI estimates, untested real-phone installation and camera scanning, no full accessibility scan, usability not yet tested with users (section 3).'],
  ], { boldFirst: true, size: 18 }),

  // 12 ────────────────────────────────────────────────────────────
  h1('12. Week 8 Student Report Sheet'),
  sheet([
    ['Student / ID', 'Yousif Al-Samrre  /  ____________'],
    ['Project title', 'GymFlow – A Web-Based Gym Membership, Class Management and Workout Tracking System'],
    ['GitHub URL', `${REPO} (public)`],
    ['Week 8 dates', '24–25 November 2026'],
  ]),
  h2('12.1 Required deliverables'),
  ...bullets([
    '☐ Nearly complete report – chapter plan ready, update is the first task of Week 9 (section 9)',
    '☑ Professional README – README.md in the public repository',
    '☑ Final architecture diagrams – docs/diagrams/architecture.svg and the ER diagram',
    '☑ Final screenshots – docs/screenshots/, with captions in the README and in this report',
    '☑ Clean GitHub repository – public, organised, meaningful commits',
  ]),
];

writeDocument(buildDocument({ headerText: 'Weekly Progress Report – Week 8', title: 'GymFlow – Week 8 Report', children }), out);
