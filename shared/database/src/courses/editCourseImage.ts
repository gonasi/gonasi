import type { EditCourseImageSubmitValues } from '@gonasi/schemas/courses';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { THUMBNAILS_BUCKET } from '../constants';
import type { ApiResponse } from '../types';

/**
 * Updates a course's image in Supabase Storage and updates the course record in the database.
 * Always uploads to a new unique path to avoid stale caching, and deletes the old image afterward.
 *
 * @param supabase - The Supabase client
 * @param assetData - Object containing the courseId, image, current imageUrl, and blurHash
 * @returns A success or error response
 */
export const editCourseImage = async (
  supabase: TypedSupabaseClient,
  assetData: EditCourseImageSubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { image, courseId, blurHash } = assetData;

  if (!image) {
    return {
      success: false,
      message: 'No image found to upload.',
    };
  }

  try {
    // Use a consistent file name to avoid duplicates and stale caching
    const fileExtension = image.name.split('.').pop()?.toLowerCase();
    const stableFileName = `${courseId}/thumbnail.${fileExtension}`;

    // Upload the new image and allow overwrite
    const { data: uploadResponse, error: uploadError } = await supabase.storage
      .from(THUMBNAILS_BUCKET)
      .upload(stableFileName, image, {
        upsert: true, // allows overwriting existing file
        cacheControl: '31536000', // still apply long cache; update with CDN strategy if needed
        metadata: {
          id: courseId,
        },
      });

    if (uploadError || !uploadResponse?.path) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        message: 'Upload didn’t work out. Want to try that again?',
      };
    }

    const finalImagePath = uploadResponse.path;

    const { error: updateError } = await supabase
      .from('courses')
      .update({
        updated_by: userId,
        image_url: finalImagePath,
        blur_hash: blurHash,
      })
      .eq('id', courseId);

    if (updateError) {
      console.error('Upload course thumbnail error: ', updateError);
      // Revert by deleting the uploaded image
      await supabase.storage.from(THUMBNAILS_BUCKET).remove([finalImagePath]);

      return {
        success: false,
        message: 'Thumbnail was uploaded, but saving it to the course didn’t work out.',
      };
    }

    return {
      success: true,
      message: 'Your new course thumbnail is all set!',
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      message: 'Something went sideways. Try again shortly.',
    };
  }
};
