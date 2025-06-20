import type { PublishCourseSchemaTypes } from '@gonasi/schemas/publish';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Validates that a given value is a non-empty string (for ID checks).
 */
const isValidId = (id: unknown): id is string => typeof id === 'string' && id.trim().length > 0;

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

  const categoryId = data.courseOverview.course_categories?.id;
  const subCategoryId = data.courseOverview.course_sub_categories?.id;
  const pathwayId = data.courseOverview.pathways?.id;

  // Validate required foreign keys
  if (!isValidId(categoryId)) {
    return { success: false, message: 'Invalid course category selected.' };
  }
  if (!isValidId(subCategoryId)) {
    return { success: false, message: 'Invalid course sub-category selected.' };
  }
  if (!isValidId(pathwayId)) {
    return { success: false, message: 'Invalid course pathway selected.' };
  }

  try {
    // Filter only active pricing options
    const activePricingData = data.pricingData.filter((item) => item.is_active);

    const { error } = await supabase.from('published_courses').upsert({
      id: data.courseOverview.id,
      name: data.courseOverview.name,
      description: data.courseOverview.description,
      image_url: data.courseOverview.image_url,
      blur_hash: data.courseOverview.blur_hash,

      // Foreign keys
      course_category_id: categoryId,
      course_sub_category_id: subCategoryId,
      pathway_id: pathwayId,

      // Optional denormalized metadata for fast querying
      course_categories: data.courseOverview.course_categories,
      course_sub_categories: data.courseOverview.course_sub_categories,
      pathways: data.courseOverview.pathways,

      // Structured content
      pricing_data: activePricingData, // ✅ only active pricing
      course_chapters: data.courseChapters,
      lessons_with_blocks: data.lessonsWithBlocks,

      chapters_count: data.courseChapters.length,
      lessons_count: data.lessonsWithBlocks.length,

      // Audit
      created_by: userId,
      updated_by: userId,
    });

    if (error) {
      console.error('[upsertPublishCourse] Supabase error:', error);
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
    console.error('[upsertPublishCourse] Unexpected error:', err);
    return {
      success: false,
      message: 'An unexpected error occurred while publishing the course. Please try again later.',
    };
  }
};
