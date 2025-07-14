import type { TypedSupabaseClient } from '../client';
import { ORGANIZATION_PROFILE_PHOTOS } from '../constants';

interface GenerateSignedOrgProfileUrlArgs {
  supabase: TypedSupabaseClient;
  imagePath: string;
}

export async function generateSignedOrgProfileUrl({
  supabase,
  imagePath,
}: GenerateSignedOrgProfileUrlArgs): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(ORGANIZATION_PROFILE_PHOTOS)
      .createSignedUrl(imagePath, 3600);

    if (error) {
      console.error(`[generateSignedOrgProfileUrl] Failed for ${imagePath}:`, error.message);
      return null;
    }

    return data?.signedUrl || null;
  } catch (error) {
    console.error(`[generateSignedOrgProfileUrl] Unexpected error for ${imagePath}:`, error);
    return null;
  }
}
