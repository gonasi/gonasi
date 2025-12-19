import { getSignedUrl } from '@gonasi/cloudinary';

import type { TypedSupabaseClient } from '../client';

interface FetchOrganizationProfileParams {
  supabase: TypedSupabaseClient;
  handle: string;
}

export const fetchPublicOrganizationProfile = async ({
  supabase,
  handle,
}: FetchOrganizationProfileParams) => {
  const { data: org, error } = await supabase
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
      is_verified,
      created_at,
      updated_at,
      created_by,
      owned_by,
      updated_by,
      deleted_by
    `,
    )
    .eq('handle', handle)
    .single();

  if (error || !org) return null;

  // Generate Cloudinary signed URL for avatar with cache busting
  let signedAvatarUrl: string | undefined;
  if (org.avatar_url) {
    try {
      // Use updated_at timestamp as version for cache busting
      const version = org.updated_at ? new Date(org.updated_at).getTime() : undefined;

      signedAvatarUrl = getSignedUrl(org.avatar_url, {
        width: 400,
        height: 400,
        quality: 'auto',
        format: 'auto',
        crop: 'fill',
        version,
      });
    } catch (error) {
      console.error('Error generating Cloudinary URL for organization avatar:', error);
    }
  }

  // Generate Cloudinary signed URL for banner with cache busting
  let signedBannerUrl: string | undefined;
  if (org.banner_url) {
    try {
      // Use updated_at timestamp as version for cache busting
      const version = org.updated_at ? new Date(org.updated_at).getTime() : undefined;

      signedBannerUrl = getSignedUrl(org.banner_url, {
        width: 1200,
        height: 450,
        quality: 'auto',
        format: 'auto',
        crop: 'fill',
        version,
      });
    } catch (error) {
      console.error('Error generating Cloudinary URL for organization banner:', error);
    }
  }

  return {
    ...org,
    signed_avatar_url: signedAvatarUrl,
    signed_banner_url: signedBannerUrl,
  };
};
