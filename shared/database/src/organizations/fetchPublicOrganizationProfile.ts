import { getSignedUrl } from '@gonasi/cloudinary';

import type { TypedSupabaseClient } from '../client';
import { ORGANIZATION_BANNER_PHOTOS } from '../constants';

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

  // Generate Supabase signed URL for banner (still using Supabase Storage)
  let signedBannerUrl: string | undefined;
  if (org.banner_url) {
    const { data: bannerData } = await supabase.storage
      .from(ORGANIZATION_BANNER_PHOTOS)
      .createSignedUrl(org.banner_url, 3600);
    signedBannerUrl = bannerData?.signedUrl;
  }

  return {
    ...org,
    signed_avatar_url: signedAvatarUrl,
    signed_banner_url: signedBannerUrl,
  };
};
