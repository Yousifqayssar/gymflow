// Asks the backend whether the API and the database are running.
// Always resolves (never throws) with: { api: boolean, database: boolean }
export async function fetchHealth() {
  try {
    const response = await fetch('/api/health');
    // The API also answers with JSON when the database is down (status 503),
    // so we read the body for every status code.
    const body = await response.json();
    return { api: true, database: body.database === 'up' };
  } catch {
    // Network error or a non-JSON reply: the API itself is not reachable.
    return { api: false, database: false };
  }
}
