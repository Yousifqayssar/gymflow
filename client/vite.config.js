import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  // react(): JSX support + instant updates in the browser when you save a file.
  // tailwindcss(): turns the Tailwind classes we use into real CSS.
  plugins: [react(), tailwindcss()],
  build: {
    // The 3D dumbbell on the login page (three.js) is one file of ~540 kB (~130 kB compressed).
    // It is loaded on its own, only on the login page, after the form is shown – so the warning
    // limit is raised just above it. The rest of the app stays far below.
    chunkSizeWarningLimit: 600,
  },
  // Screen tests (npm test): components run in jsdom, a simulated browser inside Node.js.
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
  server: {
    // During development, forward every request starting with /api to the Express server.
    // The browser only ever talks to localhost:5173, so there are no CORS problems.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
