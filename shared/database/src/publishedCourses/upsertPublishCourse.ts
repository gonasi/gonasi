import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import { PUBLISHED_THUMBNAILS, THUMBNAILS_BUCKET } from '../constants';
import type { ApiResponse } from '../types';
import { getTransformedDataToPublish } from './getTransformedDataToPublish';

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
    // Handle thumbnail copying first (outside transaction)
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

    // Use a custom RPC function for atomic transaction
    const { error: rpcError } = await supabase.rpc('upsert_published_course_with_content', {
      course_data: {
        id: data.id,
        organization_id: data.organization_id ?? '',
        category_id: data.category_id,
        subcategory_id: data.subcategory_id,
        is_active: data.is_active,
        name: data.name,
        description: data.description,
        image_url: data.image_url,
        blur_hash: data.blur_hash,
        visibility: data.visibility,
        course_structure_overview: data.course_structure_overview,
        total_chapters: data.total_chapters,
        total_lessons: data.total_lessons,
        total_blocks: data.total_blocks,
        pricing_tiers: data.pricing_tiers,
        has_free_tier: data.has_free_tier,
        min_price: data.min_price,
        total_enrollments: data.total_enrollments,
        active_enrollments: data.active_enrollments,
        completion_rate: data.completion_rate,
        average_rating: data.average_rating,
        total_reviews: data.total_reviews,
        published_by: userId,
        published_at: new Date().toISOString(),
      },
      structure_content: data.course_structure_content,
    });

    if (rpcError) {
      console.error('[upsertPublishCourse] RPC upsert error:', rpcError);
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
