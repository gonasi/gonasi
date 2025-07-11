import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { PUBLISHED_THUMBNAILS, THUMBNAILS_BUCKET } from '../constants';
import type { ApiResponse } from '../types';
import { getTransformedDataToPublish } from './getTransformedDataToPublish';

/**
 * Validates that a given value is a non-empty string (for ID checks).
 */

interface UpsertPublishCourseArgs {
  supabase: TypedSupabaseClient;
  organizationId: string;
  courseId: string;
}

export const upsertPublishCourse = async ({
  supabase,
  organizationId,
  courseId,
}: UpsertPublishCourseArgs): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  const data = await getTransformedDataToPublish({ supabase, organizationId, courseId });

  try {
    // Handle thumbnail copying
    // First, attempt to delete the file in the destination bucket (if it exists)
    await supabase.storage.from(PUBLISHED_THUMBNAILS).remove([data.image_url]);

    // Then, copy the thumbnail to the published bucket
    const { error: copyError } = await supabase.storage
      .from(THUMBNAILS_BUCKET)
      .copy(data.image_url, data.image_url, {
        destinationBucket: PUBLISHED_THUMBNAILS,
      });

    if (copyError) {
      console.error('[upsertPublishCourse] Thumbnail copy error:', copyError);
      return {
        success: false,
        message: 'Failed to copy course thumbnail to the published bucket.',
      };
    }

    const payload = {
      ...data,

      // Required fields by the DB schema that are NOT in the Zod schema
      published_by: userId,
      published_at: new Date().toISOString(),

      // Flatten totals from `course_structure` (duplicated for filtering/sorting)
      total_chapters: data.course_structure.total_chapters,
      total_lessons: data.course_structure.total_lessons,
      total_blocks: data.course_structure.total_blocks,

      // Serialize nested structures to match JSON column types
      course_structure: JSON.stringify(data.course_structure),
      pricing_tiers: JSON.stringify(data.pricing_tiers),
    };

    // Simple upsert operation
    const { error } = await supabase.from('published_courses').upsert(payload);

    if (error) {
      console.error('[upsertPublishCourse] Supabase upsert error:', error);
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
