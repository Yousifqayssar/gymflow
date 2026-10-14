import 'dotenv/config';
import { z } from 'zod';

// Describes every environment variable the server needs.
// If one is missing or invalid, the server refuses to start with a clear message.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.url().default('http://localhost:5173'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid environment variables:');
  console.error(z.prettifyError(result.error));
  process.exit(1);
}

export const env = result.data;
