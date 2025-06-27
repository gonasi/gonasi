import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

export const getMyOwnProfile = async (supabase: TypedSupabaseClient) => {
  const userId = await getUserId(supabase);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, email, full_name, avatar_url, blur_hash')
    .eq('id', userId)
    .single();

  // Return null if query failed or onboarding is incomplete
  if (error || !profile?.username) {
    return null;
  }

  return profile;
};
