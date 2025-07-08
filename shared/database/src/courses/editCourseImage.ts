import type { EditCourseImageSubmitValues } from '@gonasi/schemas/courses';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { THUMBNAILS_BUCKET } from '../constants';
import type { ApiResponse } from '../types';

export const editCourseImage = async (
  supabase: TypedSupabaseClient,
  assetData: EditCourseImageSubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { image, courseId, blurHash } = assetData;

  console.log('courseid: ', courseId);

  if (!image) {
    return {
      success: false,
      message: 'No image found to upload.',
    };
  }

  try {
    // Use courseId directly in the path structure instead of metadata
    const stableFileName = `${courseId}/thumbnail.webp`;

    // Check if file already exists
    const { data: existingFiles } = await supabase.storage
      .from(THUMBNAILS_BUCKET)
      .list(courseId, { search: 'thumbnail.webp' });

    const fileAlreadyExists = existingFiles?.some((f) => f.name === 'thumbnail.webp');

    // Upload the new image (conditionally upsert)
    const { data: uploadResponse, error: uploadError } = await supabase.storage
      .from(THUMBNAILS_BUCKET)
      .upload(stableFileName, image, {
        upsert: fileAlreadyExists,
        cacheControl: '3600',
        // Remove metadata approach, use path-based approach instead
      });

    if (uploadError || !uploadResponse?.path) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        message: `Upload didn't work out. Want to try that again?`,
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
      await supabase.storage.from(THUMBNAILS_BUCKET).remove([finalImagePath]);

      return {
        success: false,
        message: `Thumbnail was uploaded, but saving it to the course didn't work out.`,
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
