import type { TypedSupabaseClient } from '../client';

/**
 * Checks if the provided email is already taken by another user.
 * Unlike usernames, emails must be unique across all users.
 */
export const checkEmailExists = async (
  supabase: TypedSupabaseClient,
  email: string,
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = No rows found for .single()
      console.error('Failed to check email existence:', error);
      return false; // or throw if you want strict error handling
    }

    return Boolean(data); // true if email exists, false otherwise
  } catch (err) {
    console.error('Unexpected error during email check:', err);
    return false; // or throw if preferred
  }
};
