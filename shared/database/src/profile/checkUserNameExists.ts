import { getUserProfile } from '@gonasi/database/profile';

import type { TypedSupabaseClient } from '../client';

/**
 * Checks if the provided username is already taken by another user.
 * Allows the current user to reuse their own username.
 */
export const checkUserNameExists = async (
  supabase: TypedSupabaseClient,
  username: string,
): Promise<boolean> => {
  try {
    const { user } = await getUserProfile(supabase);

    // Allow reuse of the same username by the current user
    if (user?.username === username) {
      return false;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (error) {
      console.error('Failed to check username existence:', error);
      return false; // Or throw if you want to bubble this up
    }

    return Boolean(data); // true if username exists, false otherwise
  } catch (err) {
    console.error('Unexpected error during username check:', err);
    return false; // Or throw if preferred
  }
};
