import { jwtDecode } from 'jwt-decode';

import type { LoginFormSchemaTypes } from '@gonasi/schemas/auth';

import type { TypedSupabaseClient, UserRole } from '../client';

export async function getUserId(supabase: TypedSupabaseClient): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? '';
}

export async function getUserRole(supabase: TypedSupabaseClient): Promise<UserRole | 'user'> {
  const { data } = await supabase.auth.getSession();

  const token = data?.session?.access_token;
  if (!token) return 'user';

  const { user_role } = jwtDecode<{ user_role?: UserRole }>(token);
  return user_role ?? 'user';
}

export const logOut = async (supabase: TypedSupabaseClient) => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const signInWithEmailAndPassword = async (
  supabase: TypedSupabaseClient,
  payload: LoginFormSchemaTypes,
) => {
  const { email, password } = payload;
  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { error, data };
};

interface SignUpTypes extends LoginFormSchemaTypes {
  emailRedirectTo: string;
}

export const signUpWithEmailAndPassword = async (
  supabase: TypedSupabaseClient,
  payload: SignUpTypes,
) => {
  const { email, password, emailRedirectTo } = payload;
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
    },
  });

  return { error, data };
};
