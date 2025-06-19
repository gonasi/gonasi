import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getUserRole, signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../../auth';
import { supabase } from '../lib/supabase';
import { resetDatabase } from '../utils';
import {
  createLoginPayload,
  createSignupPayload,
  createStaffSignupPayload,
  createSuperUserSignupPayload,
} from './helpers';

let userPayload: ReturnType<typeof createSignupPayload>;
let staffPayload: ReturnType<typeof createStaffSignupPayload>;
let suPayload: ReturnType<typeof createSuperUserSignupPayload>;

describe('Supabase login', () => {
  beforeAll(async () => {
    await resetDatabase();

    // Create and store a user payload
    userPayload = createSignupPayload();
    await signUpWithEmailAndPassword(supabase, userPayload);

    // Create and store a staff payload
    staffPayload = createStaffSignupPayload({ fullName: 'Staff User' });
    await signUpWithEmailAndPassword(supabase, staffPayload);

    // Create and store a su payload
    suPayload = createSuperUserSignupPayload({ fullName: 'Super User' });
    await signUpWithEmailAndPassword(supabase, suPayload);
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it('should log in with correct credentials', async () => {
    const { data, error } = await signInWithEmailAndPassword(supabase, {
      intent: 'login',
      email: userPayload.email,
      password: userPayload.password,
    });

    expect(error).toBeNull();
    expect(data?.user?.email).toBe(userPayload.email);
  });

  it('should fail login with wrong password', async () => {
    const { data, error } = await signInWithEmailAndPassword(supabase, {
      intent: 'login',
      email: userPayload.email,
      password: 'WrongPassword!',
    });

    expect(data).to.deep.equal({ user: null, session: null });
    expect(error?.message).toMatch(/invalid/i);
  });

  it('should fail login with non-existent email', async () => {
    const { data, error } = await signInWithEmailAndPassword(supabase, {
      intent: 'login',
      email: 'nonexistent@example.com',
      password: 'TestPassword123!',
    });

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

  it('should get user role as user', async () => {
    const { data, error } = await signInWithEmailAndPassword(supabase, {
      intent: 'login',
      email: userPayload.email,
      password: userPayload.password,
    });

    expect(error).toBeNull();
    expect(data?.user?.email).toBe(userPayload.email);

    const userRole = await getUserRole(supabase);

    expect(userRole).toBe('user');
  });

  it('should get user role as go_staff', async () => {
    const { data, error } = await signInWithEmailAndPassword(supabase, {
      intent: 'login',
      email: staffPayload.email,
      password: staffPayload.password,
    });

    expect(error).toBeNull();
    expect(data?.user?.email).toBe(staffPayload.email);

    const userRole = await getUserRole(supabase);

    expect(userRole).toBe('go_staff');
  });

  it('should get user role as go_su', async () => {
    const { data, error } = await signInWithEmailAndPassword(supabase, {
      intent: 'login',
      email: suPayload.email,
      password: suPayload.password,
    });

    expect(error).toBeNull();
    expect(data?.user?.email).toBe(suPayload.email);

    const userRole = await getUserRole(supabase);

    expect(userRole).toBe('go_su');
  });
});
