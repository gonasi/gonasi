import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../../auth';
import { getUserProfile } from '../../profile';
import { createLoginPayload, createSignupPayload } from '../auth/helpers';
import { supabase } from '../lib/supabase';
import { resetDatabase } from '../utils';

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

  it('should fail to fetch profile with wrong password', async () => {
    const loginPayload = createLoginPayload({
      email: signupPayload.email,
      password: 'WrongPassword!',
    });
    const { error } = await signInWithEmailAndPassword(supabase, loginPayload);

    expect(error?.message).toMatch(/invalid/i);

    const profile = await getUserProfile(supabase);
    expect(profile.user).toBeNull(); // should fail or be null because login failed
  });

  it('should fail to fetch profile with non-existent email', async () => {
    const loginPayload = createLoginPayload({ email: 'nonexistent@example.com' });
    const { error } = await signInWithEmailAndPassword(supabase, loginPayload);

    expect(error?.message).toMatch(/invalid/i);

    const profile = await getUserProfile(supabase);
    expect(profile.user).toBeNull();
  });

  it('should fail to fetch profile with missing email', async () => {
    const loginPayload = createLoginPayload({ email: undefined as any });
    const { error } = await signInWithEmailAndPassword(supabase, loginPayload);

    expect(error).not.toBeNull();

    const profile = await getUserProfile(supabase);
    expect(profile.user).toBeNull();
  });

  it('should fail to fetch profile with missing password', async () => {
    const loginPayload = createLoginPayload({ password: undefined as any });
    const { error } = await signInWithEmailAndPassword(supabase, loginPayload);

    expect(error).not.toBeNull();

    const profile = await getUserProfile(supabase);
    expect(profile.user).toBeNull();
  });
});
