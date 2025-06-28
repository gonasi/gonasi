import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { PROFILE_PHOTOS } from '../constants';
import type { Database } from '../schema';

type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Extends the default `profiles` row with an optional signed avatar URL.
 */
type ProfileWithSignedUrl = Profile & {
  signed_url?: string;
};

/**
 * Fetches the currently signed-in user's full profile info,
 * including a signed URL for the profile photo if available.
 */
export const getUserProfile = async (
  supabase: TypedSupabaseClient,
): Promise<{ user: ProfileWithSignedUrl } | { user: null }> => {
  // Get the current user's ID
  const id = await getUserId(supabase);

  // Query the 'profiles' table for relevant user fields
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id,
      username,
      email,
      full_name,
      avatar_url,
      blur_hash,
      phone_number,
      phone_number_verified,
      email_verified,
      is_public,
      country_code,
      preferred_language,
      account_verified,
      notifications_enabled,
      created_at,
      updated_at,
      mode,
      active_organization_id
    `,
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    return { user: null };
  }

  const profile: ProfileWithSignedUrl = { ...data };

  // If avatar_url exists, generate a signed URL valid for 1 hour
  if (profile.avatar_url) {
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(PROFILE_PHOTOS)
      .createSignedUrl(profile.avatar_url, 3600);

    if (!signedUrlError) {
      profile.signed_url = signedUrlData?.signedUrl;
    }
  }

  return { user: profile };
};
