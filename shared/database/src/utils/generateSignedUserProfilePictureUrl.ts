import type { TypedSupabaseClient } from '../client';
import { PROFILE_PHOTOS } from '../constants';

interface GenerateSignedUserProfilePictureUrlArgs {
  supabase: TypedSupabaseClient;
  imagePath: string;
}

export async function generateSignedUserProfilePictureUrl({
  supabase,
  imagePath,
}: GenerateSignedUserProfilePictureUrlArgs): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(PROFILE_PHOTOS)
      .createSignedUrl(imagePath, 3600);

    if (error) {
      console.error(
        `[generateSignedUserProfilePictureUrl] Failed for ${imagePath}:`,
        error.message,
      );
      return null;
    }

    return data.signedUrl ?? null;
  } catch (err) {
    console.error(`[generateSignedUserProfilePictureUrl] Unexpected error for ${imagePath}:`, err);
    return null;
  }
}
