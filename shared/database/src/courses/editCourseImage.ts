import type { EditCourseImageSubmitValues } from '@gonasi/schemas/courses';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { COURSES_BUCKET } from '../constants';
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
  const { image, imageUrl, courseId, blurHash } = assetData;

  // No image provided — short-circuit
  if (!image) {
    return {
      success: false,
      message: 'No image found to upload.',
    };
  }

  try {
    // Create a unique file name using timestamp + random suffix
    const fileExtension = image.name.split('.').pop()?.toLowerCase();
    const newFileName = `${courseId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExtension}`;

    // Upload the new image to Supabase Storage
    const { data: uploadResponse, error: uploadError } = await supabase.storage
      .from(COURSES_BUCKET)
      .upload(newFileName, image, {
        cacheControl: '31536000', // 1 year (to allow CDN/browser long-term caching)
        metadata: {
          id: courseId, // Used for RLS validation
        },
      });

    // If the upload fails, return early with error
    if (uploadError || !uploadResponse?.path) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        message: 'Upload didn’t work out. Want to try that again?',
      };
    }

    const finalImagePath = uploadResponse.path;

    // Update the course record with the new image path and blur hash
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        updated_by: userId,
        image_url: finalImagePath,
        blur_hash: blurHash,
      })
      .eq('id', courseId);

    if (updateError) {
      console.log('Upload course thumbanil error: ', updateError);
      // If updating the course record fails, remove the newly uploaded image
      await supabase.storage.from(COURSES_BUCKET).remove([finalImagePath]);

      return {
        success: false,
        message: 'Thumbnail was uploaded, but saving it to the course didn’t work out.',
      };
    }

    // After successful update, delete the old image if it exists and isn't the same
    if (imageUrl && imageUrl !== finalImagePath) {
      const oldFileName = imageUrl.split('/').pop();
      if (oldFileName) {
        const oldPath = `${courseId}/${oldFileName}`;
        await supabase.storage.from(COURSES_BUCKET).remove([oldPath]);
      }
    }

    return {
      success: true,
      message: 'Your new course thumbnail is all set!',
    };
  } catch (error) {
    // Handle unexpected errors (e.g., network issues)
    console.error('Unexpected error:', error);
    return {
      success: false,
      message: 'Something went sideways. Try again shortly.',
    };
  }
};
