import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // We test a Node.js API, not browser code.
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
