// Safety check: tests delete data, so they must never run against
// the development (or production) database by mistake.
export function assertTestDatabase() {
  const help = 'Create server/.env.test (copy .env.test.example) with a database name ending in "_test".';

  if (!process.env.DATABASE_URL) {
    throw new Error(`DATABASE_URL is not set for tests. ${help}`);
  }

  const databaseName = new URL(process.env.DATABASE_URL).pathname.slice(1);

  if (!databaseName.endsWith('_test')) {
    throw new Error(`Refusing to run tests on database "${databaseName}". ${help}`);
  }
}
