// utils.ts
import type { SupabaseClient } from '@supabase/supabase-js';

import { signInWithEmailAndPassword } from '../../auth';

interface WaitOptions {
  retries?: number;
  delayMs?: number;
}

/**
 * Waits until a user can successfully sign in using the provided credentials.
 * This is useful in test environments where Supabase may take time to provision the user after sign-up.
 *
 * @param supabase - Supabase client instance
 * @param email - Email used for login
 * @param password - Password used for login
 * @param options - Optional settings: retries (default: 10), delayMs (default: 500)
 * @throws Error if user is not login-ready after max retries
 */
export async function waitForUserToBeLoginReady(
  supabase: SupabaseClient,
  email: string,
  password: string,
  options: WaitOptions = {},
): Promise<void> {
  const retries = options.retries ?? 10;
  const delayMs = options.delayMs ?? 500;

  for (let i = 0; i < retries; i++) {
    const { data, error } = await signInWithEmailAndPassword(supabase, { email, password });

    if (!error && data?.user?.email === email) {
      return;
    }

    await new Promise((res) => setTimeout(res, delayMs));
  }

  throw new Error(`User ${email} not ready for login after ${retries} attempts`);
}
