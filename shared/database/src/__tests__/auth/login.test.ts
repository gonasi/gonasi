import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../../auth';
import { supabase } from '../lib/supabase';
import { resetDatabase } from '../utils';
import { createLoginPayload, createSignupPayload } from './helpers';

describe('Supabase login', () => {
  beforeAll(async () => {
    await resetDatabase();

    // Create a user to log in with
    const payload = createSignupPayload();
    await signUpWithEmailAndPassword(supabase, payload);
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it('should log in with correct credentials', async () => {
    const payload = createLoginPayload();
    const { data, error } = await signInWithEmailAndPassword(supabase, payload);

    expect(error).toBeNull();
    expect(data?.user?.email).toBe(payload.email);
  });

  it('should fail login with wrong password', async () => {
    const payload = createLoginPayload({ password: 'WrongPassword!' });
    const { data, error } = await signInWithEmailAndPassword(supabase, payload);

    expect(data).to.deep.equal({ user: null, session: null });
    expect(error?.message).toMatch(/invalid/i);
  });

  it('should fail login with non-existent email', async () => {
    const payload = createLoginPayload({ email: 'nonexistent@example.com' });
    const { data, error } = await signInWithEmailAndPassword(supabase, payload);

    expect(data).to.deep.equal({ user: null, session: null });
    expect(error?.message).toMatch(/invalid/i);
  });

  it('should fail login with missing email', async () => {
    const payload = createLoginPayload({ email: undefined as any });
    const { data, error } = await signInWithEmailAndPassword(supabase, payload);

    expect(data).to.deep.equal({ user: null, session: null });
    expect(error).not.toBeNull();
  });

  it('should fail login with missing password', async () => {
    const payload = createLoginPayload({ password: undefined as any });
    const { data, error } = await signInWithEmailAndPassword(supabase, payload);

    expect(data).to.deep.equal({ user: null, session: null });
    expect(error).not.toBeNull();
  });
});
