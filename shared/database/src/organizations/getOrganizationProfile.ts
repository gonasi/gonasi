import type { TypedSupabaseClient } from '../client';
import { ORGANIZATION_BANNER_PHOTOS, ORGANIZATION_PROFILE_PHOTOS } from '../constants';

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

  // Generate signed avatar URL
  if (profile.avatar_url) {
    const { data: signed } = await supabase.storage
      .from(ORGANIZATION_PROFILE_PHOTOS)
      .createSignedUrl(profile.avatar_url, 3600);
    signedAvatarUrl = signed?.signedUrl;
  }

  // Generate signed banner URL
  if (profile.banner_url) {
    const { data: signed } = await supabase.storage
      .from(ORGANIZATION_BANNER_PHOTOS)
      .createSignedUrl(profile.banner_url, 3600);
    signedBannerUrl = signed?.signedUrl;
  }

  return {
    ...profile,
    signed_avatar_url: signedAvatarUrl,
    signed_banner_url: signedBannerUrl,
  };
};
