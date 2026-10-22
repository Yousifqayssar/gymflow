// Settings shared by the e2e start script and the tests. Secrets are read from server/.env,
// never written here.
import fs from 'node:fs';

export const E2E_PORT = 4300;
export const BASE_URL = `http://localhost:${E2E_PORT}`;
export const DEMO_PASSWORD = 'demo1234';

function serverEnv(key) {
  const text = fs.readFileSync(new URL('../server/.env', import.meta.url), 'utf8');
  const match = new RegExp(`^${key}=(.*)$`, 'm').exec(text);
  if (!match) throw new Error(`${key} is missing in server/.env`);
  return match[1].trim().replace(/^["']|["']$/g, '');
}

// The development database URL with the database name replaced by gymflow_e2e.
export function e2eDatabaseUrl() {
  const url = new URL(serverEnv('DATABASE_URL'));
  url.pathname = '/gymflow_e2e';
  return url.toString();
}

export const admin = () => ({ email: serverEnv('SEED_ADMIN_EMAIL'), password: serverEnv('SEED_ADMIN_PASSWORD') });
export const demo = (firstName) => ({ email: `${firstName}@demo.gymflow.local`, password: DEMO_PASSWORD });
