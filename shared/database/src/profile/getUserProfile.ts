import { getSignedUrl } from '@gonasi/cloudinary';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { Database } from '../schema';

type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Extends the default `profiles` row with an optional signed avatar URL.
 */
export type ProfileWithSignedUrl = Profile & {
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

  // If avatar_url exists, generate a Cloudinary signed URL valid for 1 hour
  if (profile.avatar_url) {
    // Use updated_at timestamp as version for cache busting
    const version = profile.updated_at ? new Date(profile.updated_at).getTime() : undefined;

    profile.signed_url = getSignedUrl(profile.avatar_url, {
      width: 400,
      height: 400,
      quality: 'auto',
      format: 'auto',
      expiresInSeconds: 3600,
      resourceType: 'image',
      version,
    });
  }

  return { user: profile };
};
