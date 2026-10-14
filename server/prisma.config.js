import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Tells the Prisma CLI (migrate, generate, studio) where the schema lives
// and which database to connect to.
// We read DATABASE_URL with process.env (not Prisma's env() helper) so that
// `prisma generate` also works before a .env file exists, e.g. right after cloning.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Command run by `npx prisma db seed`.
    seed: 'node prisma/seed.js',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
