import type { Session } from 'react-router';
import { createCookieSessionStorage, redirect } from 'react-router';
import type { z } from 'zod';

import { getServerEnv } from '~/.server/env.server';

const { SESSION_SECRET, NODE_ENV } = getServerEnv();

// Define cookie names as constants
export const FORM_STEPPER_COOKIE_NAMES = {
  basicInfo: 'onboarding-basic-information',
};

export const formStepperSessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'en_form_stepper',
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secrets: SESSION_SECRET.split(','),
    secure: NODE_ENV === 'production',
  },
});

// Helper function to get session data
export async function getFormStepperSessionData(request: Request) {
  return formStepperSessionStorage.getSession(request.headers.get('cookie'));
}

// Helper function for validation and redirection
export function validateStepData<T>(
  session: Session,
  key: string,
  schema: z.ZodSchema<T>,
  redirectUrl: string,
) {
  const data = session.get(key) || {};
  if (!schema.safeParse(data).success) {
    throw redirect(redirectUrl);
  }
  return data as T;
}

// Helper function to delete a key from the session
export async function deleteFormStepperSessionKey(request: Request, key: string) {
  const session = await getFormStepperSessionData(request);
  session.unset(key);
  return new Response(null, {
    headers: {
      'Set-Cookie': await formStepperSessionStorage.commitSession(session),
    },
  });
}
