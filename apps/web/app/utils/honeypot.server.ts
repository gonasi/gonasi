import { Honeypot, SpamError } from 'remix-utils/honeypot/server';

import { getServerEnv } from '~/.server/env.server';

const { NODE_ENV, HONEYPOT_SECRET } = getServerEnv();

export const honeypot = new Honeypot({
  validFromFieldName: NODE_ENV === 'test' ? null : undefined,
  encryptionSeed: HONEYPOT_SECRET,
});

export async function checkHoneypot(formData: FormData) {
  try {
    await honeypot.check(formData);
  } catch (error) {
    if (error instanceof SpamError) {
      console.log('Error honeypot: ', error);
      throw new Response('Form not submitted properly', { status: 400 });
    }
    throw error;
  }
}
