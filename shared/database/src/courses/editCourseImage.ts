import { generatePublicId, uploadToCloudinary } from '@gonasi/cloudinary';
import type { EditCourseImageSubmitValues } from '@gonasi/schemas/courses';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

export const editCourseImage = async (
  supabase: TypedSupabaseClient,
  assetData: EditCourseImageSubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);
  const { image, courseId } = assetData;

  if (!image) {
    return {
      success: false,
      message: 'No image found to upload.',
    };
  }

  try {
    // Get course to retrieve organization_id
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('organization_id')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      console.error('Course fetch error:', courseError);
      return {
        success: false,
        message: 'Could not find course.',
      };
    }

    // Generate Cloudinary public_id for draft thumbnail
    const publicId = generatePublicId({
      scope: 'draft',
      resourceType: 'thumbnail',
      organizationId: course.organization_id ?? undefined,
      courseId,
    });

    // Upload thumbnail to Cloudinary
    // Note: invalidate is automatically set to true when overwrite is true
    const {
      success: uploadSuccess,
      data: uploadData,
      error: uploadError,
    } = await uploadToCloudinary(image, publicId, {
      resourceType: 'image',
      type: 'authenticated', // Private/authenticated delivery
      overwrite: true, // This also invalidates CDN cache
    });

    if (!uploadSuccess || !uploadData) {
      console.error('Cloudinary upload error:', uploadError);
      return {
        success: false,
        message: `Upload didn't work out. Want to try that again?`,
      };
    }

    const finalImagePublicId = uploadData.publicId;

    // Use current timestamp for aggressive cache busting
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('courses')
      .update({
        updated_by: userId,
        updated_at: now, // Update timestamp to bust cache
        image_url: finalImagePublicId, // Store Cloudinary public_id
      })
      .eq('id', courseId);

    if (updateError) {
      console.error('Upload course thumbnail error: ', updateError);
      // Note: We could delete from Cloudinary here, but keeping it doesn't hurt
      // since it will be overwritten on next upload

      return {
        success: false,
        message: `Thumbnail was uploaded, but saving it to the course didn't work out.`,
      };
    }

    // Note: BlurHash is not needed with Cloudinary as it provides
    // dynamic blur transformations via getBlurPlaceholderUrl() helper

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
