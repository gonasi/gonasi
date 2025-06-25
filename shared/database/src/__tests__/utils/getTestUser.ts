import { TEST_USERS } from '../fixtures/test-data';
import type { EmailType } from '../utils/generateRandomEmail';

export const SU_EMAIL = 'gonasiapp@gmail.com';
export const SU_PASSWORD = 'SuPass123';

/**
 * Retrieve a test user by type and optional prefix (like "user1", "staff2")
 */
export function getTestUser(type: EmailType, prefix?: string) {
  return (
    TEST_USERS.find((user) => {
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
