import fs from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { resetDatabase } from './helpers/database.js';
import { createUser } from './helpers/users.js';

// Every endpoint of the API must refuse visitors who are not logged in – except the few public ones –
// and must refuse logged-in users whose role is not allowed. The endpoints are discovered
// automatically (mount paths from app.js, routes and roles from each router file), so a new endpoint
// is checked without anyone having to remember to add it here.

const PUBLIC = new Set(['GET /api/health', 'POST /api/auth/register', 'POST /api/auth/login']);
const ROLES = ['ADMIN', 'TRAINER', 'MEMBER'];

// Roles declared with authorize(...) in a list of middleware layers (null = no role restriction).
const rolesIn = (layers) => layers.map((l) => l.handle?.allowedRoles).filter(Boolean);

async function discoverEndpoints() {
  const source = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const imports = Object.fromEntries([...source.matchAll(/import (\w+) from '(\.\/routes\/[\w.]+)';/g)].map(([, name, file]) => [name, file]));
  const mounts = [...source.matchAll(/app\.use\('(\/api\/[\w-]+)', (\w+Routes)\)/g)];

  const endpoints = [];
  for (const [, prefix, name] of mounts) {
    const { default: router } = await import(new URL(`../src/${imports[name].slice(2)}`, import.meta.url));
    router.stack.forEach((layer, index) => {
      if (!layer.route) return;
      // Roles from router.use(authorize(...)) above this route, and from the route itself; all must allow.
      const declared = [...rolesIn(router.stack.slice(0, index).filter((l) => !l.route)), ...rolesIn(layer.route.stack)];
      const allowed = declared.length ? ROLES.filter((role) => declared.every((list) => list.includes(role))) : ROLES;
      for (const method of Object.keys(layer.route.methods)) {
        const path = prefix + (layer.route.path === '/' ? '' : layer.route.path);
        endpoints.push({ name: `${method.toUpperCase()} ${path}`, method, url: path.replace(/:\w+/g, '1'), allowed });
      }
    });
  }
  return endpoints;
}

const endpoints = await discoverEndpoints();
const protectedEndpoints = endpoints.filter((e) => !PUBLIC.has(e.name));
// [endpoint, role] pairs where the role must be refused with 403.
const forbidden = protectedEndpoints.flatMap((e) => ROLES.filter((role) => !e.allowed.includes(role)).map((role) => [e.name, role, e]));

const tokens = {};
beforeAll(async () => {
  await resetDatabase();
  for (const role of ROLES) tokens[role] = (await createUser({ role })).token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

const send = ({ method, url }, token) => {
  const req = request(app)[method](url);
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

describe('route protection', () => {
  it('finds all endpoints of the API (at least 60), including the 3 public ones', () => {
    expect(endpoints.length).toBeGreaterThanOrEqual(60);
    for (const name of PUBLIC) expect(endpoints.map((e) => e.name)).toContain(name);
  });

  it.each(protectedEndpoints.map((e) => [e.name, e]))('%s refuses a visitor without a login token (401)', async (name, endpoint) => {
    expect((await send(endpoint)).status).toBe(401);
  });

  it.each(protectedEndpoints.map((e) => [e.name, e]))('%s refuses a forged login token (401)', async (name, endpoint) => {
    // Signed with a different secret: looks like a real token, but the signature does not match.
    const forged = jwt.sign({ sub: '1', role: 'ADMIN' }, 'not-the-real-secret-not-the-real-secret', { expiresIn: '1h' });

    expect((await send(endpoint, forged)).status).toBe(401);
  });

  it.each(forbidden)('%s refuses a logged-in %s (403)', async (name, role, endpoint) => {
    expect((await send(endpoint, tokens[role])).status).toBe(403);
  });
});
