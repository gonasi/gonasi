import { defineConfig, mergeConfig } from 'vitest/config';

import vitestConfig from '../../tooling/gonasi-vitest';

export default mergeConfig(
  vitestConfig,
  defineConfig({
    test: {
      environment: 'node',
      testTimeout: 10000,
      hookTimeout: 30000,
      // Run tests sequentially to avoid database conflicts
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
      coverage: {
        exclude: ['testing/*'],
      },
    },
  }),
);
