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
      ` 
        id,
        username,
        full_name,
        avatar_url,
        is_onboarding_complete,
        bio,
        website_url,
        twitter_url,
        linkedin_url,
        github_url,
        instagram_url,
        facebook_url,
        tiktok_url,
        youtube_url,
        discord_url
      `,
    )
    .eq('username', username)
    .single();

  // Return null if query failed or onboarding is incomplete
  if (error || !profile?.is_onboarding_complete) {
    return null;
  }

  return {
    user: {
      ...profile,
      isMyProfile: userId === profile.id,
    },
  };
};
