import { afterAll, beforeAll } from 'vitest';

import { DatabaseManager, TestUserManager } from './test-helpers';

// Global setup runs once for entire test suite
beforeAll(async () => {
  console.log('🚀 Setting up test environment...');
  await DatabaseManager.resetDatabase();
}, 30000);

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  await TestUserManager.cleanupUsers();
  await DatabaseManager.resetDatabase();
});
