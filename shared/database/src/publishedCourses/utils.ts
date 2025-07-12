import { PUBLISHED_THUMBNAILS } from '../constants';

export async function createPublishedThumbnailSignedUrl(
  supabase: any,
  imageUrl: string,
): Promise<string | null> {
  try {
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(PUBLISHED_THUMBNAILS)
      .createSignedUrl(imageUrl, 3600);

    if (signedUrlError) {
      console.error(
        `[createSignedUrl] Failed to create signed URL for ${imageUrl}:`,
        signedUrlError.message,
      );
      return null;
    }

    return signedUrlData?.signedUrl || null;
  } catch (err) {
    console.error(`[createSignedUrl] Unexpected error for ${imageUrl}:`, err);
    return null;
  }
}
