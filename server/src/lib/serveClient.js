import express from 'express';
import fs from 'node:fs';
import path from 'node:path';

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

// In production the same server also sends the React website (the built files in client/dist),
// so the website and the API share one address: no CORS, and the client's "/api/..." paths just work.
// Does nothing when the folder has not been built, so development and tests are not affected.
export function serveClient(app, distPath) {
  const indexFile = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexFile)) return false;

  app.use(
    express.static(distPath, {
      index: false,
      setHeaders(res, filePath) {
        // Files in /assets have a hash in their name (index-3fa1c2.js), so they never change: cache them for a year.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', `public, max-age=${ONE_YEAR_SECONDS}, immutable`);
      },
    }),
  );

  // Every other page address (/login, /progress, /workouts/3 …) gets index.html; React Router then shows the right page.
  // API addresses are left alone, so an unknown /api route still gets the JSON 404.
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexFile);
  });
  return true;
}
