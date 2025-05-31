import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

interface GetProfileByUsernameParams {
  supabase: TypedSupabaseClient;
  username: string;
}

export const getProfileByUsername = async ({ supabase, username }: GetProfileByUsernameParams) => {
  const userId = await getUserId(supabase);

  // Fetch the user profile by username
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(
      `
      id,
      username,
      full_name,
      avatar_url,
      is_onboarding_complete,
      bio,
      website,
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

  // Exit early if there's an error or onboarding is incomplete
  if (profileError || !profile?.is_onboarding_complete) {
    return null;
  }

  // Check if the user has an active company
  const { data: company } = await supabase
    .from('user_active_companies')
    .select('company_id')
    .match({ user_id: userId, company_id: profile.id })
    .single();

  return {
    user: {
      ...profile,
      userCompanyMatch: Boolean(company?.company_id),
    },
  };
};
