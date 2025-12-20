import { getSignedUrl } from '@gonasi/cloudinary';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';

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
    .select('id, username, email, full_name, avatar_url, blur_hash, is_public, updated_at')
    .eq('id', userId)
    .single();

  // Return null if query failed or user hasn't completed onboarding (i.e., no username)
  if (error || !profile?.username) {
    return null;
  }

  let signedUrl: string | undefined;

  // If avatar_url exists, generate a Cloudinary signed URL valid for 1 hour
  if (profile.avatar_url) {
    // Use updated_at timestamp as version for cache busting
    const version = profile.updated_at ? new Date(profile.updated_at).getTime() : undefined;

    signedUrl = getSignedUrl(profile.avatar_url, {
      width: 400,
      height: 400,
      quality: 'auto',
      format: 'auto',
      expiresInSeconds: 3600,
      resourceType: 'image',
      version,
    });
  }

  // Return profile data with optional signed avatar URL
  return {
    ...profile,
    signed_url: signedUrl,
  };
};
