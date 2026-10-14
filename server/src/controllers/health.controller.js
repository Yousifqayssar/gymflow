import { isDatabaseReachable } from '../services/health.service.js';

// GET /api/health
// Lets us (and the React app) check that the API and the database are running.
export async function getHealth(req, res) {
  const databaseUp = await isDatabaseReachable();

  // 503 = "Service Unavailable": the API runs but can't do its job without the database.
  res.status(databaseUp ? 200 : 503).json({
    status: databaseUp ? 'ok' : 'error',
    database: databaseUp ? 'up' : 'down',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
