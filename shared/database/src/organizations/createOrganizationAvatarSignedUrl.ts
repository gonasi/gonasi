import type { TypedSupabaseClient } from '../client';
import { ORGANIZATION_PROFILE_PHOTOS } from '../constants';

export async function createOrganizationAvatarSignedUrl(
  supabase: TypedSupabaseClient,
  avatarPath: string | null,
): Promise<string | null> {
  if (!avatarPath) return null;

  try {
    const { data, error } = await supabase.storage
      .from(ORGANIZATION_PROFILE_PHOTOS)
      .createSignedUrl(avatarPath, 3600);
    if (error) {
      console.error('[createOrganizationAvatarSignedUrl] Error:', error.message);
      return null;
    }
    return data?.signedUrl ?? null;
  } catch (err) {
    console.error('[createOrganizationAvatarSignedUrl] Unexpected error:', err);
    return null;
  }
}
