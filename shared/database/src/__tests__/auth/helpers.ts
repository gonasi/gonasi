import type { SignupFormSchemaTypes } from '@gonasi/schemas/auth';

// Generate a random string for unique test emails
const random = Math.random().toString(36).substring(2, 8);

// Default test user email and password
const email = `test-${random}@example.com`;
const password = 'TestPassword123!';
const redirectTo = 'http://localhost:3000/welcome';

/**
 * Creates a login payload with optional overrides.
 * Used for simulating user login during tests.
 */
export const createLoginPayload = (
  overrides: Partial<{
    email: string;
    password: string;
    redirectTo: string | null;
  }> = {},
) => ({
  email,
  password,
  redirectTo,
  ...overrides, // Apply overrides last to allow custom values
});

/**
 * Creates a signup payload for a test user.
 * Accepts optional field overrides for flexibility.
 */
export const createSignupPayload = (
  overrides: Partial<SignupFormSchemaTypes> = {},
): SignupFormSchemaTypes => ({
  email,
  password,
  fullName: 'Test User',
  redirectTo,
  ...overrides,
});

// --- Staff Signup/Login Payloads ---

/**
 * Creates a signup payload for a staff user.
 * Ensures the email ends with '@gonasi.com'.
 */
export const createStaffSignupPayload = (
  overrides: Partial<SignupFormSchemaTypes> = {},
): SignupFormSchemaTypes => {
  const staffEmail = overrides.email?.endsWith('@gonasi.com')
    ? overrides.email
    : `staff-${Math.random().toString(36).substring(2, 8)}@gonasi.com`;

  return createSignupPayload({
    email: staffEmail,
    fullName: 'Staff User',
    ...overrides,
  });
};

/**
 * Creates a login payload for a staff user.
 * Relies on the staff signup payload to generate credentials.
 */
export const createStaffLoginPayload = (signupOverrides: Partial<SignupFormSchemaTypes> = {}) => {
  const signupPayload = createStaffSignupPayload(signupOverrides);

  return createLoginPayload({
    email: signupPayload.email,
    password: signupPayload.password,
    redirectTo: signupPayload.redirectTo,
  });
};

// --- Super User Signup/Login Payloads ---

// Constant email for the Super User
const SUPER_USER_EMAIL = 'gonasiapp@gmail.com';

/**
 * Creates a signup payload for the Super User.
 * Uses a fixed email to represent a privileged user.
 */
export const createSuperUserSignupPayload = (
  overrides: Partial<SignupFormSchemaTypes> = {},
): SignupFormSchemaTypes => {
  return createSignupPayload({
    email: SUPER_USER_EMAIL,
    fullName: 'Super User',
    ...overrides,
  });
};

/**
 * Creates a login payload for the Super User.
 * Uses the data from the super user signup payload.
 */
export const createSuperUserLoginPayload = (
  signupOverrides: Partial<SignupFormSchemaTypes> = {},
) => {
  const signupPayload = createSuperUserSignupPayload(signupOverrides);

  return createLoginPayload({
    email: signupPayload.email,
    password: signupPayload.password,
    redirectTo: signupPayload.redirectTo,
  });
};
