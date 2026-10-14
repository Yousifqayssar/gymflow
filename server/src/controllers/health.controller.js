// GET /api/health
// Lets us (and later the React app) check that the API is running.
export function getHealth(req, res) {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
