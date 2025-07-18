import { TEST_USERS } from '../fixtures/test-data';
import type { EmailType } from './generateTestEmail';

/**
 * Retrieve a test user by type and optional prefix (like "user1", "staff2")
 */
export function getTestUser(type: EmailType, prefix?: string) {
  return (
    TEST_USERS.find((user) => {
      if (!user.email) return false;

      const domain = type === 'staff' ? 'gonasi.com' : 'test.com';
      const matchesType = user.email.endsWith(`@${domain}`);
      const matchesPrefix = prefix ? user.email.startsWith(prefix) : true;

      return matchesType && matchesPrefix;
    }) ??
    (() => {
      throw new Error(`Test user not found for type "${type}" with prefix "${prefix}"`);
    })()
  );
}
