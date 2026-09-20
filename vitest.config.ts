import { defineConfig } from 'vitest/config';
import path from 'path';

// Kept separate from vite.config.ts so the build config stays about the build.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Specs live next to the code they cover.
    include: ['src/**/*.test.ts', 'supabase/functions/**/*.test.ts'],
    environment: 'node',
  },
});
