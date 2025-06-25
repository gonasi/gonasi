import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../../auth';
import { getUserProfile } from '../../profile';
import { createLoginPayload, createSignupPayload } from '../auth/helpers';
import { supabase } from '../lib/supabase';
import { resetDatabase } from '../utils/resetDatabase';

describe('Supabase profile fetching', () => {
  const signupPayload = createSignupPayload();

  beforeAll(async () => {
    await resetDatabase();

    // Create and sign in user
    await signUpWithEmailAndPassword(supabase, signupPayload);
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it('should fetch profile with correct credentials', async () => {
    const loginPayload = createLoginPayload({
      email: signupPayload.email,
      password: signupPayload.password,
    });
    await signInWithEmailAndPassword(supabase, loginPayload);

    const { user } = await getUserProfile(supabase);
    console.log('user is: ', user);
    expect(user?.email).toBe(signupPayload.email);
  });
});
