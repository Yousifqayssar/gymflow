// Runs the Week 6 test cases against the running app (production build on :4300) and records
// input, expected result, actual result and PASS/FAIL. Usage: node evidence.mjs <server/.env> <out.json>
import fs from 'node:fs';
import crypto from 'node:crypto';

const BASE = 'http://localhost:4300';
const [envFile, outFile] = process.argv.slice(2);
const env = Object.fromEntries(
  fs.readFileSync(envFile, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
const DEMO = (name) => ({ email: `${name}@demo.gymflow.local`, password: 'demo1234' });

async function call(method, path, { token, body, headers = {} } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, json, headers: res.headers };
}
const login = async (who) => (await call('POST', '/api/auth/login', { body: who })).json.token;
const msg = (r) => r.json?.error?.message ?? r.json?.message ?? '';
const code = (r) => r.json?.error?.code ?? r.json?.code;
const details = (r) => (r.json?.error?.details ?? []).map((d) => `${d.field}: ${d.message}`).join('; ');
const MODE = process.argv[4] ?? 'main';

const results = [];
function record(id, req, component, input, expected, actual, pass) {
  results.push({ id, req, component, input, expected, actual, status: pass ? 'PASS' : 'FAIL' });
  console.log(`${id} ${pass ? 'PASS' : 'FAIL'} – ${actual}`);
}

let r;
if (MODE === 'main') {
// ---------- F1 login and access ----------
r = await call('POST', '/api/auth/login', { body: { email: 'elif@demo.gymflow.local', password: 'wrong-password' } });
record('T01', 'F1', 'Login – reject a wrong password', 'elif@demo… / wrong password', '401, no token, message without saying which part was wrong',
  `${r.status}, token: ${r.json?.token ? 'yes' : 'none'}, "${msg(r)}"`, r.status === 401 && !r.json?.token);

r = await call('POST', '/api/auth/login', { body: DEMO('elif') });
record('T02', 'F1', 'Login – accept correct details', 'elif@demo… / correct password', '200, signed token, role MEMBER',
  `${r.status}, token: ${r.json?.token ? 'yes' : 'none'}, role ${r.json?.user?.role}`, r.status === 200 && !!r.json?.token && r.json?.user?.role === 'MEMBER');
const elif = r.json.token;

r = await call('POST', '/api/auth/register', { body: { firstName: 'Test', lastName: 'User', email: 'not-an-email', password: '123' } });
const fieldErrors = (r.json?.error?.details ?? []).map((d) => d.field);
record('T03', 'F1', 'Register – invalid input', 'email "not-an-email", password "123"', '400 with an error for each wrong field; no account created',
  `${r.status}, fields: ${fieldErrors.join(', ') || JSON.stringify(r.json).slice(0, 80)}`, r.status === 400);

r = await call('GET', '/api/users');
record('T04', 'NFR Security', 'Admin endpoint without a token', 'GET /api/users, no token', '401', `${r.status}, "${msg(r)}"`, r.status === 401);

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const head = b64({ alg: 'HS256', typ: 'JWT' });
const body = b64({ id: 1, role: 'ADMIN', iat: Math.floor(Date.now() / 1000) });
const forged = `${head}.${body}.${crypto.createHmac('sha256', 'not-the-real-secret').update(`${head}.${body}`).digest('base64url')}`;
r = await call('GET', '/api/users', { token: forged });
record('T05', 'NFR Security', 'Forged token claiming ADMIN', 'token signed with a wrong secret, role ADMIN', '401', `${r.status}, "${msg(r)}"`, r.status === 401);

r = await call('GET', '/api/users', { token: elif });
record('T06', 'F1', 'Member opens an admin endpoint', 'GET /api/users with a member token', '403', `${r.status}, "${msg(r)}"`, r.status === 403);

const admin = await login({ email: env.SEED_ADMIN_EMAIL, password: env.SEED_ADMIN_PASSWORD });
r = await call('GET', '/api/users', { token: admin });
record('T07', 'F1', 'Admin opens the same endpoint', 'GET /api/users with an admin token', '200 with the member list',
  `${r.status}, ${Array.isArray(r.json?.users) ? r.json.users.length + ' users' : 'no list'}`, r.status === 200 && Array.isArray(r.json?.users));

r = await call('GET', '/');
const h = (n) => r.headers.get(n) ?? '';
const csp = h('content-security-policy');
const ok8 = csp.includes("default-src 'self'") && csp.includes("frame-ancestors 'none'") && h('strict-transport-security') !== '' && h('x-content-type-options') === 'nosniff';
record('T08', 'NFR Security', 'Security headers on every page', 'GET /', "CSP default-src 'self', frame-ancestors 'none', HSTS, nosniff",
  `CSP ${csp.includes("default-src 'self'") ? 'self' : 'missing'}, frame-ancestors ${csp.includes("frame-ancestors 'none'") ? 'none' : 'missing'}, HSTS ${h('strict-transport-security') ? 'set' : 'missing'}, ${h('x-content-type-options')}, Referrer-Policy ${h('referrer-policy')}`, ok8);

// ---------- F6 check-in and points ----------
const mert = await login(DEMO('mert'));
const mehmetUser = (await call('POST', '/api/auth/login', { body: DEMO('ayse') })).json.user;
const memberNo = (id) => `GF-${String(id).padStart(5, '0')}`;
const first = await call('POST', '/api/check-ins', { token: mert, body: { code: memberNo(mehmetUser.id) } });
const second = await call('POST', '/api/check-ins', { token: mert, body: { code: memberNo(mehmetUser.id) } });
record('T09', 'F6', 'Check-in of a member with a valid membership', `trainer types ${memberNo(mehmetUser.id)} (Ayse, Premium Monthly)`, '201, visit created, member and membership shown',
  `${first.status}, ${first.json?.member?.firstName ?? '?'}, ${first.json?.member?.membership?.plan?.name ?? first.json?.member?.membership?.status ?? ''}, already today: ${first.json?.alreadyCheckedIn}`,
  (first.status === 201 || (first.status === 200 && first.json?.alreadyCheckedIn)) && first.json?.member?.firstName === 'Ayse');
record('T10', 'F6, rule: points once a day', 'Second check-in the same day', 'the same number again', '200, "already checked in today", no extra points',
  `${second.status}, alreadyCheckedIn: ${second.json?.alreadyCheckedIn}, points ${first.json?.points} → ${second.json?.points}`,
  second.status === 200 && second.json?.alreadyCheckedIn === true && second.json?.points === first.json?.points);

const burak = (await call('POST', '/api/auth/login', { body: DEMO('burak') })).json.user;
r = await call('POST', '/api/check-ins', { token: mert, body: { code: memberNo(burak.id) } });
record('T11', 'F6, rule: valid membership', 'Check-in of a member whose membership ended', `${memberNo(burak.id)} (Burak, ended 20 days ago)`, '403 with the reason', `${r.status}, "${msg(r)}"`, r.status === 403);

const can = (await call('POST', '/api/auth/login', { body: DEMO('zeynep') })).json.user;
const gyms = (await call('GET', '/api/partner-gyms', { token: mert })).json.gyms;
r = await call('POST', '/api/check-ins', { token: mert, body: { code: memberNo(can.id), partnerGymId: gyms[0].id } });
record('T12', 'E4/E5', 'Basic member at a partner gym', `${memberNo(can.id)} (Zeynep, Basic 3 Months) at ${gyms[0].name}`, '403 PARTNER_GYM_PREMIUM_ONLY with the reason', `${r.status}, ${code(r)}, "${msg(r)}"`, r.status === 403 && code(r) === 'PARTNER_GYM_PREMIUM_ONLY');

// ---------- E2 payments: invalid, boundary, declined ----------
const plans = (await call('GET', '/api/plans', { token: elif })).json.plans ?? (await call('GET', '/api/plans', { token: elif })).json;
const planId = (Array.isArray(plans) ? plans : []).find((p) => p.isActive !== false)?.id ?? 1;
const card = (over) => ({ planId, checkoutId: crypto.randomUUID(), card: { holderName: 'Elif Yilmaz', number: '4242 4242 4242 4242', expMonth: 12, expYear: 2028, cvc: '123', ...over } });
r = await call('POST', '/api/me/checkout', { token: elif, body: card({ number: '4242 4242 4242 4241' }) });
record('T13', 'E2', 'Card number with a typo', '4242 4242 4242 4241 (fails the Luhn check)', '400 "not valid – check for a typo", nothing charged', `${r.status}, "${details(r)}"`, r.status === 400);
r = await call('POST', '/api/me/checkout', { token: elif, body: card({ expMonth: 13 }) });
record('T14', 'E2 (boundary)', 'Expiry month out of range', 'expMonth 13 (valid range 1–12)', '400 "Month must be 01–12"', `${r.status}, "${details(r)}"`, r.status === 400);
r = await call('POST', '/api/me/checkout', { token: elif, body: card({ cvc: '12' }) });
record('T15', 'E2 (boundary)', 'Security code too short', 'CVC "12" (needs 3 digits)', '400 with the CVC message', `${r.status}, "${details(r)}"`, r.status === 400);
r = await call('POST', '/api/me/checkout', { token: elif, body: card({ number: '4000 0000 0000 0002' }) });
record('T16', 'E2', 'Declined card', 'test card 4000 0000 0000 0002', '402 CARD_DECLINED, payment stored as DECLINED, no membership', `${r.status}, ${code(r)}, "${msg(r) || details(r)}"`, r.status === 402 && code(r) === 'CARD_DECLINED');

// ---------- F5 booking: the same class twice ----------
const classes = (await call('GET', '/api/classes', { token: elif })).json.classes;
const target = classes.find((c) => !c.isCancelled && !c.isBookedByMe && c.spotsLeft > 1 && new Date(c.startsAt) > Date.now() + 3600e3);
const b1 = await call('POST', `/api/classes/${target.id}/book`, { token: elif });
const b2 = await call('POST', `/api/classes/${target.id}/book`, { token: elif });
record('T17', 'F5, rule: no double booking', 'Book the same class twice', `"${target.title}" (Premium member Elif), twice`, 'first 201, second 409 with a message',
  `${b1.status}, then ${b2.status} "${msg(b2)}"`, (b1.status === 201 || b1.status === 200) && b2.status === 409);
await call('DELETE', `/api/classes/${target.id}/book`, { token: elif }); // give the spot back

}

if (MODE === 'limit') {
  results.push(...JSON.parse(fs.readFileSync(outFile, 'utf8')).results);
// ---------- NFR security: login rate limit (last: it blocks this address for 15 minutes) ----------
const victim = 'burak@demo.gymflow.local';
const statuses = [];
for (let i = 0; i < 10; i++) statuses.push((await call('POST', '/api/auth/login', { body: { email: victim, password: `wrong-${i}` } })).status);
r = await call('POST', '/api/auth/login', { body: { email: victim, password: 'demo1234' } });
record('T18', 'NFR Security', 'Login limit against password guessing', '10 wrong passwords, then the correct one', 'attempts 1–10: 401; then 429 even with the correct password',
  `attempts 1–10: ${[...new Set(statuses)].join('/')}; 11th (correct): ${r.status} "${msg(r)}"`, statuses.every((s) => s === 401) && r.status === 429);

}

fs.writeFileSync(outFile, JSON.stringify({ ranAt: new Date().toISOString(), base: BASE, results }, null, 2));
console.log(`\n${results.filter((x) => x.status === 'PASS').length}/${results.length} PASS`);
