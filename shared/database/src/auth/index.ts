import { jwtDecode } from 'jwt-decode';

import type { LoginFormSchemaTypes, SignupFormSchemaTypes } from '@gonasi/schemas/auth';

import type { TypedSupabaseClient, UserRole } from '../client';

export async function getUserId(supabase: TypedSupabaseClient): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? '';
}

export async function getUserIdFromUsername(
  supabase: TypedSupabaseClient,
  username: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (error || !data) return '';

  return data.id;
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

  if (error) {
    console.error(`[signInWithEmailAndPassword]: `, {
      error: error.message,
      email,
    });
  }

  return { error, data };
};

export const signUpWithEmailAndPassword = async (
  supabase: TypedSupabaseClient,
  payload: SignupFormSchemaTypes,
) => {
  const { email, password, fullName, redirectTo } = payload;
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo ?? '/',
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    console.error(`[signUpWithEmailAndPassword]: `, {
      error: error.message,
      email,
    });
  }

  return { error, data };
};
