import { defineConfig, mergeConfig } from 'vitest/config';

import vitestConfig from '../../tooling/gonasi-vitest';

export default mergeConfig(
  vitestConfig,
  defineConfig({
    test: {
      coverage: {
        exclude: ['testing/*'],
      },
    },
  }),
);
