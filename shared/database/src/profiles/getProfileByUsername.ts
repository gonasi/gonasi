import type { TypedSupabaseClient } from '../client';

interface GetProfileByUsernameParams {
  supabase: TypedSupabaseClient;
  username: string;
}

export const getProfileByUsername = async ({ supabase, username }: GetProfileByUsernameParams) => {
  const { data, error } = await supabase
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

  if (error || !data?.is_onboarding_complete) {
    return null;
  }

  return { user: data };
};
