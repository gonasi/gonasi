import type { TypedSupabaseClient } from '../client';
import { ORGANIZATION_BANNER_PHOTOS, ORGANIZATION_PROFILE_PHOTOS } from '../constants';

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

  const [avatarRes, bannerRes] = await Promise.all([
    org.avatar_url
      ? supabase.storage.from(ORGANIZATION_PROFILE_PHOTOS).createSignedUrl(org.avatar_url, 3600)
      : Promise.resolve({ data: undefined }),
    org.banner_url
      ? supabase.storage.from(ORGANIZATION_BANNER_PHOTOS).createSignedUrl(org.banner_url, 3600)
      : Promise.resolve({ data: undefined }),
  ]);

  return {
    ...org,
    signed_avatar_url: avatarRes.data?.signedUrl,
    signed_banner_url: bannerRes.data?.signedUrl,
  };
};
