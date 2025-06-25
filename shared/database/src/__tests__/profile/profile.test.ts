import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../../auth';
import { getUserProfile } from '../../profile';
import { createLoginPayload, createSignupPayload } from '../auth/helpers';
import { supabase } from '../lib/supabase';
import { resetDatabase } from '../utils/resetDatabase';

describe('Supabase profile fetching', () => {
  const signupPayload = createSignupPayload();

  beforeAll(async () => {
    // Reset database and wait for completion
    const result = await resetDatabase();
    if (!result.success) {
      throw new Error('Failed to reset database');
    }

    // Clear any auth state
    await supabase.auth.signOut();

    // Add a small delay to ensure everything is clean
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Create and sign in user
    await signUpWithEmailAndPassword(supabase, signupPayload);
  });

  afterEach(async () => {
    // Clean auth state between tests
    await supabase.auth.signOut();
  });

  afterAll(async () => {
    await supabase.auth.signOut();
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
