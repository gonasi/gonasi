import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

/**
 * Parameters for retrieving a user profile by username.
 */
interface GetProfileByUsernameParams {
  supabase: TypedSupabaseClient;
  username: string;
}

export const getProfileByUsername = async ({ supabase, username }: GetProfileByUsernameParams) => {
  const userId = await getUserId(supabase);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'id, username, email, full_name, avatar_url, blur_hash, phone_number, phone_number_verified, email_verified, country_code',
    )
    .eq('username', username)
    .single();

  // Return null if query failed or onboarding is incomplete
  if (error || !profile?.username) {
    return null;
  }

  return {
    user: {
      ...profile,
      isMyProfile: userId === profile.id,
    },
  };
};
