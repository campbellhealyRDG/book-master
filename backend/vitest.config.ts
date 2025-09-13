import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    teardownTimeout: 60000,
    fileParallelism: false, // Run tests sequentially to avoid database conflicts
    isolate: true,
  },
  esbuild: {
    target: 'node18',
  },
});