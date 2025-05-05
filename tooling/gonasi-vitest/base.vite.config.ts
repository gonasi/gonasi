import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'istanbul',
      include: ['src/**'],
      exclude: ['src/**/*.stories.@(js|jsx|mjs|ts|tsx)', 'src/**/*.@(jsx|tsx)'],
      reportsDirectory: './testing/coverage',
      reporter: ['json', 'lcov', 'text', 'clover', 'cobertura', 'html'],
      thresholds: {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
      },
    },
  },
});
