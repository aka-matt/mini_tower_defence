import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.js'],
    globals: true,
    setupFiles: [],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/**', 'dist/**']
    }
  }
});
