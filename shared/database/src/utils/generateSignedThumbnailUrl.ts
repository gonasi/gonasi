import type { TypedSupabaseClient } from '../client';
import { PUBLISHED_THUMBNAILS } from '../constants';

interface GenerateSignedThumbnailUrlArgs {
  supabase: TypedSupabaseClient;
  imagePath: string;
}

export async function generateSignedThumbnailUrl({
  supabase,
  imagePath,
}: GenerateSignedThumbnailUrlArgs): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(PUBLISHED_THUMBNAILS)
      .createSignedUrl(imagePath, 3600);

    if (error) {
      console.error(`[generateSignedThumbnailUrl] Failed for ${imagePath}:`, error.message);
      return null;
    }

    return data?.signedUrl || null;
  } catch (error) {
    console.error(`[generateSignedThumbnailUrl] Unexpected error for ${imagePath}:`, error);
    return null;
  }
}
