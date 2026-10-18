import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { serveClient } from '../../src/lib/serveClient.js';

// A tiny fake "client/dist" folder in the temp directory, so the test does not need a real build.
let distPath;

beforeAll(() => {
  distPath = fs.mkdtempSync(path.join(os.tmpdir(), 'gymflow-dist-'));
  fs.mkdirSync(path.join(distPath, 'assets'));
  fs.writeFileSync(path.join(distPath, 'index.html'), '<!doctype html><title>GymFlow</title>');
  fs.writeFileSync(path.join(distPath, 'assets', 'index-abc123.js'), 'console.log("hi")');
});

afterAll(() => {
  fs.rmSync(distPath, { recursive: true, force: true });
});

function buildApp(folder) {
  const app = express();
  app.get('/api/ping', (req, res) => res.json({ ok: true }));
  const served = serveClient(app, folder);
  app.use((req, res) => res.status(404).json({ error: { message: 'Route not found' } }));
  return { app, served };
}

describe('serveClient', () => {
  it('sends index.html for page addresses, so React Router can show the page', async () => {
    const { app, served } = buildApp(distPath);
    const response = await request(app).get('/progress');

    expect(served).toBe(true);
    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>GymFlow</title>');
    expect(response.headers['cache-control']).toBe('no-cache');
  });

  it('sends built files with a long cache', async () => {
    const { app } = buildApp(distPath);
    const response = await request(app).get('/assets/index-abc123.js');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toContain('immutable');
  });

  it('leaves API routes alone: real ones work, unknown ones still get the JSON 404', async () => {
    const { app } = buildApp(distPath);

    expect((await request(app).get('/api/ping')).body).toEqual({ ok: true });
    const missing = await request(app).get('/api/nothing-here');
    expect(missing.status).toBe(404);
    expect(missing.body.error.message).toBe('Route not found');
  });

  it('does nothing when the website has not been built', async () => {
    const { app, served } = buildApp(path.join(distPath, 'missing'));

    expect(served).toBe(false);
    expect((await request(app).get('/progress')).status).toBe(404);
  });
});
