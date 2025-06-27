import type { TypedSupabaseClient } from '../client';

export const checkUserNameExists = async (supabase: TypedSupabaseClient, username: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  if (error) {
    return false;
  }

  if (data) return true;
  return false;
};
