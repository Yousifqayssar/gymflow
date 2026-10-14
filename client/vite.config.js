import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  // react(): JSX support + instant updates in the browser when you save a file.
  // tailwindcss(): turns the Tailwind classes we use into real CSS.
  plugins: [react(), tailwindcss()],
});
