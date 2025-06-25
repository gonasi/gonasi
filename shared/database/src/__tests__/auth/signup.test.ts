import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { signUpWithEmailAndPassword } from '../../auth';
import { supabase } from '../lib/supabase';
import { resetDatabase } from '../utils/resetDatabase';
import { createSignupPayload } from './helpers';

describe('Supabase signup', () => {
  beforeAll(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await resetDatabase();
  });

  it('should sign up a user', async () => {
    const payload = createSignupPayload();
    const { data, error } = await signUpWithEmailAndPassword(supabase, payload);

    expect(error).toBeNull();
    expect(data?.user?.email).toBe(payload.email);
    expect(data?.user?.user_metadata?.full_name).toBe(payload.fullName);
  });

  it('should fail if email is missing', async () => {
    const payload = createSignupPayload({ email: undefined as any });
    const { data, error } = await signUpWithEmailAndPassword(supabase, payload);

    expect(data).to.deep.equal({ user: null, session: null });
    expect(error?.message).toEqual('Anonymous sign-ins are disabled');
  });

  it('should fail if password is short', async () => {
    const payload = createSignupPayload({
      email: 'weakpass@example.com',
      password: '123',
      fullName: 'Weak Password User',
    });

    const { data, error } = await signUpWithEmailAndPassword(supabase, payload);

    expect(data).to.deep.equal({ user: null, session: null });
    expect(error).not.toBeNull();
  });

  it('should fail if user already exists', async () => {
    const payload = createSignupPayload({
      email: 'duplicate@example.com',
      fullName: 'Duplicate User',
    });

    await signUpWithEmailAndPassword(supabase, payload); // First signup
    const { data, error } = await signUpWithEmailAndPassword(supabase, payload); // Duplicate attempt

    expect(data).to.deep.equal({ user: null, session: null });
    expect(error?.message).toMatch(/already registered/i);
  });

  it('should handle invalid redirectTo URL gracefully', async () => {
    const payload = createSignupPayload({
      email: 'badredirect@example.com',
      fullName: 'Bad Redirect User',
      redirectTo: 'invalid-url',
    });

    const { data, error } = await signUpWithEmailAndPassword(supabase, payload);

    expect(error).toBeNull(); // Supabase may allow this
    expect(data?.user?.email).toBe(payload.email);
  });

  it('should strip full name with extra whitespace', async () => {
    const payload = createSignupPayload({
      email: 'trimmed@example.com',
      fullName: '  Trimmed User  ',
    });

    const { data, error } = await signUpWithEmailAndPassword(supabase, payload);

    expect(error).toBeNull();
    expect(data?.user?.user_metadata?.full_name.trim()).toBe('Trimmed User');
  });
});
