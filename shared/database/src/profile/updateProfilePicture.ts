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
 *  - Path must start with the authenticated user’s ID
 */
export const updateProfilePicture = async (
  supabase: TypedSupabaseClient,
  submitData: UpdateProfilePictureSchemaTypes,
) => {
  // Get currently authenticated user ID
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
    // Construct a consistent and RLS-compliant path: <user_id>/avatar.<ext>
    const fileExtension = image.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/avatar.${fileExtension}`;

    // Upload the file to the user's folder with overwrite and caching
    const { data: uploadResponse, error: uploadError } = await supabase.storage
      .from(PROFILE_PHOTOS)
      .upload(fileName, image, {
        upsert: true, // overwrite existing file
        cacheControl: '31536000', // 1 year CDN cache
        metadata: {
          user_id: userId,
        },
      });

    // Handle upload failure
    if (uploadError || !uploadResponse?.path) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        message: 'Upload didn’t work out. Want to try that again?',
        data: null,
      };
    }

    const imageUrl = uploadResponse.path;

    // Update user's profile with the new image path
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: imageUrl })
      .eq('id', userId);

    // If DB update fails, clean up uploaded image
    if (updateError) {
      console.error('Profile update error:', updateError);
      await supabase.storage.from(PROFILE_PHOTOS).remove([imageUrl]);

      return {
        success: false,
        message: 'Image was uploaded, but saving it to your profile didn’t work out.',
        data: null,
      };
    }

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
