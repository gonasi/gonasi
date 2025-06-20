import type { PublishCourseSchemaTypes } from '@gonasi/schemas/publish';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Upserts (inserts or updates) a published course with associated metadata.
 * @param supabase - Typed Supabase client
 * @param data - Course data to publish
 * @returns API response indicating success or failure
 */
export const upsertPublishCourse = async (
  supabase: TypedSupabaseClient,
  data: PublishCourseSchemaTypes,
): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  try {
    const { error } = await supabase.from('published_courses').upsert({
      id: data.courseOverview.id,
      name: data.courseOverview.name,
      description: data.courseOverview.description,
      image_url: data.courseOverview.image_url,
      blur_hash: data.courseOverview.blur_hash,

      // Foreign key IDs
      course_category_id: data.courseOverview.course_categories.id,
      course_sub_category_id: data.courseOverview.course_sub_categories.id,
      pathway_id: data.courseOverview.pathways.id,

      // Optional nested data for denormalized caching
      course_categories: data.courseOverview.course_categories,
      course_sub_categories: data.courseOverview.course_sub_categories,
      pathways: data.courseOverview.pathways,

      // Nested structured content
      pricing_data: data.pricingData,
      course_chapters: data.courseChapters,
      lessons_with_blocks: data.lessonsWithBlocks,

      // Audit trail
      created_by: userId,
      updated_by: userId,
    });

    if (error) {
      console.error({
        function: `[upsertPublishCourse]`,
        message: error.message,
      });
      return {
        success: false,
        message: 'Failed to publish the course. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Course published successfully.',
    };
  } catch (err) {
    console.error('Unexpected error in upsertPublishCourse:', err);
    return {
      success: false,
      message: 'An unexpected error occurred while publishing the course. Please try again later.',
    };
  }
};
