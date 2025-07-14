import type { TypedSupabaseClient } from '../client';
import { ORGANIZATION_BANNER_PHOTOS } from '../constants';

interface GenerateSignedOrgBannerUrlArgs {
  supabase: TypedSupabaseClient;
  imagePath: string;
}

export async function generateSignedOrgBannerUrl({
  supabase,
  imagePath,
}: GenerateSignedOrgBannerUrlArgs): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(ORGANIZATION_BANNER_PHOTOS)
      .createSignedUrl(imagePath, 3600);

    if (error) {
      console.error(`[generateSignedOrgBannerUrl] Failed for ${imagePath}:`, error.message);
      return null;
    }

    return data?.signedUrl || null;
  } catch (error) {
    console.error(`[generateSignedOrgBannerUrl] Unexpected error for ${imagePath}:`, error);
    return null;
  }
}
