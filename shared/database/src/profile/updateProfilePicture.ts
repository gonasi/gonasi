import type { UpdateProfilePictureSchemaTypes } from '@gonasi/schemas/settings';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { PROFILE_PHOTOS } from '../constants';

/**
 * Uploads a new profile photo to the user's personal avatar folder
 * and updates the user's profile with the uploaded image path.
 *
 * Ensures compliance with RLS policy:
 *  - Bucket must be 'profile_photos'
 *  - Path must start with the authenticated user's ID
 */
export const updateProfilePicture = async (
  supabase: TypedSupabaseClient,
  submitData: UpdateProfilePictureSchemaTypes,
) => {
  const userId = await getUserId(supabase);
  const { image } = submitData;

  if (!image) {
    return {
      success: false,
      message: 'No image found to upload.',
      data: null,
    };
  }

  try {
    const fileExtension = image.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/avatar.${fileExtension}`;

    const { data: uploadResponse, error: uploadError } = await supabase.storage
      .from(PROFILE_PHOTOS)
      .upload(fileName, image, {
        upsert: true,
        cacheControl: '31536000',
        metadata: {
          user_id: userId,
        },
      });

    if (uploadError || !uploadResponse?.path) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        message: "Upload didn't work out. Want to try that again?",
        data: null,
      };
    }

    const imageUrl = uploadResponse.path;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: imageUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      await supabase.storage.from(PROFILE_PHOTOS).remove([imageUrl]);

      return {
        success: false,
        message: "Image was uploaded, but saving it to your profile didn't work out.",
        data: null,
      };
    }

    // Start BlurHash generation in the background - don't await it
    // This allows the function to return immediately while BlurHash processing continues
    supabase.functions
      .invoke('generate-blurhash', {
        body: {
          avatar_url: imageUrl,
          user_id: userId,
        },
      })
      .catch((err) => {
        // Log the error but don't fail the entire operation
        console.error('Background BlurHash generation failed:', err);
      });

    return {
      success: true,
      message: 'Your new profile picture is all set!',
      data: null,
    };
  } catch (err) {
    console.error('Unexpected error:', err);
    return {
      success: false,
      message: 'Something went sideways. Try again shortly.',
      data: null,
    };
  }
};
