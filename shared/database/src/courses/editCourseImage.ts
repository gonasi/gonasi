import type { EditCourseImageSubmitValues } from '@gonasi/schemas/courses';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { COURSES_BUCKET } from '../constants';
import type { ApiResponse } from '../types';

/**
 * Updates a course image in storage and updates the course record
 * @param supabase - Typed Supabase client instance
 * @param assetData - Course image data including image file, imageUrl, and courseId
 * @returns ApiResponse with success status and message
 */
export const editCourseImage = async (
  supabase: TypedSupabaseClient,
  assetData: EditCourseImageSubmitValues,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase); // Retrieve the user ID from authentication context

  const { image, imageUrl, courseId } = assetData;

  console.log('courseId: ', courseId);

  try {
    // Check if the user is authorized to update this course (must be admin or su)
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('company_memberships')
      .select('staff_role, company_id')
      .eq('staff_id', userId)
      .in('staff_role', ['su', 'admin'])
      .single();

    if (userRoleError || !userRoleData) {
      return {
        success: false,
        message:
          'You are not authorized to update course images. Admin or superuser role required.',
      };
    }

    // Get course company_id to verify user is updating a course within their company
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('company_id')
      .eq('id', courseId)
      .single();

    if (courseError || !courseData) {
      return {
        success: false,
        message: 'Course not found.',
      };
    }

    // Ensure user is updating a course in their own company
    if (courseData.company_id !== userRoleData.company_id) {
      return {
        success: false,
        message: 'You are not authorized to update courses from other companies.',
      };
    }

    // Handle image upload/update
    let finalImagePath = imageUrl;

    if (image) {
      if (imageUrl) {
        // Update existing image
        const { error: uploadError } = await supabase.storage
          .from(COURSES_BUCKET)
          .update(`${courseId}/${imageUrl.split('/').pop()}`, image, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.log(uploadError);
          return {
            success: false,
            message: 'Failed to update course image.',
          };
        }
      } else {
        // Upload new image - ensure we're using courseId as prefix
        const fileExtension = image.name.split('.').pop()?.toLowerCase();
        const fileName = `${courseId}/${Date.now()}-${Math.random()}.${fileExtension}`;

        const { data: uploadResponse, error: uploadError } = await supabase.storage
          .from(COURSES_BUCKET)
          .upload(fileName, image, {
            cacheControl: '3600',
          });

        if (uploadError || !uploadResponse?.path) {
          console.log('upload error: ', uploadError);
          return {
            success: false,
            message: 'Failed to upload course image.',
          };
        }

        finalImagePath = uploadResponse.path;
      }
    }

    // Update course record with new image URL
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        updated_by: userId,
        image_url: finalImagePath,
      })
      .eq('id', courseId);

    if (updateError) {
      // Clean up the newly uploaded image if course update fails
      if (!imageUrl && finalImagePath && finalImagePath !== imageUrl) {
        await supabase.storage.from(COURSES_BUCKET).remove([finalImagePath]);
      }

      return {
        success: false,
        message: 'Failed to update course record.',
      };
    }

    return {
      success: true,
      message: 'Course image updated successfully.',
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      message: 'An error occurred. Please try again.',
    };
  }
};
