import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { PROFILE_PHOTOS } from '../constants';

/**
 * Fetches the current authenticated user's profile with optional signed avatar URL.
 *
 * @param supabase - The Supabase client instance.
 * @returns The user's profile with a signed URL for the avatar if available, or `null` if profile is missing or incomplete.
 */
export const getMyOwnProfile = async (supabase: TypedSupabaseClient) => {
  // Get the currently authenticated user's ID
  const userId = await getUserId(supabase);

  // Fetch profile data from the 'profiles' table
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, email, full_name, avatar_url, blur_hash, is_public')
    .eq('id', userId)
    .single();

  // Return null if query failed or user hasn't completed onboarding (i.e., no username)
  if (error || !profile?.username) {
    return null;
  }

  let signedUrl: string | undefined;

  // If avatar_url exists, generate a signed URL valid for 1 hour
  if (profile.avatar_url) {
    const { data: signedUrlData } = await supabase.storage
      .from(PROFILE_PHOTOS)
      .createSignedUrl(profile.avatar_url, 3600);

    signedUrl = signedUrlData?.signedUrl;
  }

  // Return profile data with optional signed avatar URL
  return {
    ...profile,
    signed_url: signedUrl,
  };
};
