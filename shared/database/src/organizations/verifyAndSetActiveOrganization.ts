import {
  type VerifyAndSetActiveOrgResponse,
  VerifyAndSetActiveOrgResponseSchema,
} from '@gonasi/schemas/organizations';

import type { TypedSupabaseClient } from '../client';
import { ORGANIZATION_BANNER_PHOTOS, ORGANIZATION_PROFILE_PHOTOS } from '../constants';

// Signed URL expiry duration (1 week = 7 days * 24h * 3600s)
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 7; // 604800 seconds

/**
 * Verifies an organization by ID, sets it as the active organization,
 * and replaces avatar/banner paths with signed URLs if available.
 */
export async function verifyAndSetActiveOrganization({
  supabase,
  organizationId,
}: {
  supabase: TypedSupabaseClient;
  organizationId: string;
}): Promise<VerifyAndSetActiveOrgResponse> {
  try {
    // Call Postgres RPC to verify and set active organization
    const { data, error } = await supabase.rpc('rpc_verify_and_set_active_organization', {
      organization_id_from_url: organizationId,
    });

    if (error) {
      console.error('RPC error:', error);
      return { success: false, message: 'Server error', data: null };
    }

    // Validate response structure with Zod
    const parsed = VerifyAndSetActiveOrgResponseSchema.safeParse(data);
    if (!parsed.success) {
      console.error('Zod validation error:', parsed.error.format());
      return {
        success: false,
        message: 'Invalid server response format.',
        data: null,
      };
    }

    const organization = parsed.data.data?.organization;
    let finalAvatarUrl = organization?.avatar_url ?? null;
    let finalBannerUrl = organization?.banner_url ?? null;

    // Generate signed URL for avatar (if path exists)
    if (organization?.avatar_url) {
      try {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from(ORGANIZATION_PROFILE_PHOTOS)
          .createSignedUrl(organization.avatar_url, SIGNED_URL_EXPIRY);

        if (signedUrlError) {
          console.error('Error creating signed URL for avatar:', signedUrlError);
        } else {
          finalAvatarUrl = signedUrlData.signedUrl;
        }
      } catch (err) {
        console.error('Exception while creating signed URL for avatar:', err);
      }
    }

    // Generate signed URL for banner (if path exists)
    if (organization?.banner_url) {
      try {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from(ORGANIZATION_BANNER_PHOTOS)
          .createSignedUrl(organization.banner_url, SIGNED_URL_EXPIRY);

        if (signedUrlError) {
          console.error('Error creating signed URL for banner:', signedUrlError);
        } else {
          finalBannerUrl = signedUrlData.signedUrl;
        }
      } catch (err) {
        console.error('Exception while creating signed URL for banner:', err);
      }
    }

    // Replace original avatar/banner URLs with signed versions
    const result = { ...parsed.data };
    if (result.data?.organization) {
      result.data.organization.avatar_url = finalAvatarUrl;
      result.data.organization.banner_url = finalBannerUrl;
    }

    return result;
  } catch (err) {
    console.error('verifyAndSetActiveOrganization error:', err);
    return {
      success: false,
      message: 'Something went wrong. Please try again later.',
      data: null,
    };
  }
}
