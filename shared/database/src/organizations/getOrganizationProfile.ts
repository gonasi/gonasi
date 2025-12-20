import { getSignedUrl } from '@gonasi/cloudinary';

import type { TypedSupabaseClient } from '../client';

interface GetOrganizationProfileParams {
  supabase: TypedSupabaseClient;
  organizationId: string;
}

export const getOrganizationProfile = async ({
  supabase,
  organizationId,
}: GetOrganizationProfileParams) => {
  const { data: profile, error } = await supabase
    .from('organizations')
    .select(
      `
      id,
      name,
      handle,
      description,
      website_url,
      avatar_url,
      blur_hash,
      banner_url,
      banner_blur_hash,
      is_public,
      is_verified,
      email,
      phone_number,
      phone_number_verified,
      email_verified,
      whatsapp_number,
      location,
      created_at,
      updated_at,
      created_by,
      owned_by,
      updated_by,
      deleted_by
    `,
    )
    .eq('id', organizationId)
    .single();

  if (error || !profile) {
    return null;
  }

  let signedAvatarUrl: string | undefined;
  let signedBannerUrl: string | undefined;

  // Generate signed avatar URL from Cloudinary with cache busting
  if (profile.avatar_url) {
    // Use updated_at timestamp as version for cache busting
    const version = profile.updated_at ? new Date(profile.updated_at).getTime() : undefined;

    signedAvatarUrl = getSignedUrl(profile.avatar_url, {
      width: 400,
      height: 400,
      quality: 'auto',
      format: 'auto',
      crop: 'fill',
      version,
    });
  }

  // Generate signed banner URL from Cloudinary with cache busting
  if (profile.banner_url) {
    // Use updated_at timestamp as version for cache busting
    const version = profile.updated_at ? new Date(profile.updated_at).getTime() : undefined;

    signedBannerUrl = getSignedUrl(profile.banner_url, {
      width: 1200,
      height: 450,
      quality: 'auto',
      format: 'auto',
      crop: 'fill',
      version,
    });
  }

  return {
    ...profile,
    signed_avatar_url: signedAvatarUrl,
    signed_banner_url: signedBannerUrl,
  };
};
