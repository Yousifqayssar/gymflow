// Starts the whole GymFlow app for the end-to-end tests (run by Playwright, see playwright.config.js):
//   1. prepares a separate database "gymflow_e2e": migrations, admin account, fresh demo data
//   2. builds the website (client/dist)
//   3. starts the server in production mode on port 4300; it also serves the built website,
//      exactly like on Render (one address, security headers on).
// The development database and the unit-test database are never touched.
import { execSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { e2eDatabaseUrl, E2E_PORT } from './e2e-env.js';

const server = fileURLToPath(new URL('../server/', import.meta.url));
const client = fileURLToPath(new URL('../client/', import.meta.url));
const run = (command, cwd, env = {}) => execSync(command, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });

const db = { DATABASE_URL: e2eDatabaseUrl(), NODE_ENV: 'development' };
console.log('[e2e] preparing database gymflow_e2e …');
run('npx prisma migrate deploy', server, db);
run('node prisma/seed.js', server, db);
run('node prisma/seed-demo.js', server, db);

console.log('[e2e] building the website …');
run('npm run build', client);

console.log(`[e2e] starting the server on port ${E2E_PORT} …`);
spawn('node', ['src/server.js'], {
  cwd: server,
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: e2eDatabaseUrl(), NODE_ENV: 'production', PORT: String(E2E_PORT) },
});
