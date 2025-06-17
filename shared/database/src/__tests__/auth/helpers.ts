import type { SignupFormSchemaTypes } from '@gonasi/schemas/auth';

const email = `test+user@example.com`;
const password = 'TestPassword123!';
const redirectTo = 'http://localhost:3000/welcome';

export const createLoginPayload = (
  overrides: Partial<{
    email: string;
    password: string;
    redirectTo: string | null;
  }> = {},
) => ({
  intent: 'login' as const, // <- ensures literal type
  email,
  password,
  redirectTo,
  ...overrides,
});

export const createSignupPayload = (
  overrides: Partial<SignupFormSchemaTypes> = {},
): SignupFormSchemaTypes => ({
  email,
  password,
  fullName: 'Test User',
  redirectTo,
  ...overrides,
});
