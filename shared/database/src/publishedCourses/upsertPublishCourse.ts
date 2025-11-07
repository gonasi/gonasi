import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import {
  FILE_LIBRARY_BUCKET,
  PUBLISHED_FILE_LIBRARY_BUCKET,
  PUBLISHED_THUMBNAILS,
  THUMBNAILS_BUCKET,
} from '../constants';
import { deleteAllPublishedFilesInFolder } from '../files/deleteAllPublishedFilesInFolder';
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

  // Step 1: Check if user can publish
  const { data: canPublishData, error: canPublishError } = await supabase.rpc(
    'can_publish_course',
    {
      course_id: courseId,
      org_id: organizationId,
      user_id: userId,
    },
  );

  if (canPublishError) {
    console.error('[upsertPublishCourse] Permission check error:', canPublishError);
    return {
      success: false,
      message: 'Failed to check publishing permissions.',
    };
  }

  if (!canPublishData) {
    return {
      success: false,
      message: 'You do not have permission to publish this course.',
    };
  }

  // Step 2: Get transformed data for publishing
  const data = await getTransformedDataToPublish({ supabase, organizationId, courseId });

  try {
    // Step 3: Handle thumbnail copy first
    await supabase.storage.from(PUBLISHED_THUMBNAILS).remove([data.image_url]);

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

    // Step 4: Upsert published course via RPC
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
        message: rpcError.message,
      };
    }

    // Step 5: Delete existing published files
    await supabase.from('published_file_library').delete().match({
      course_id: courseId,
      organization_id: organizationId,
    });

    const { error: deleteError } = await deleteAllPublishedFilesInFolder({
      supabase,
      organizationId,
      courseId,
    });
    if (deleteError) {
      console.error('[upsertPublishCourse] Failed to delete course files:', deleteError);
    }

    // Step 6: Copy course files to published folder
    const { data: fileData, error: fileError } = await supabase
      .from('file_library')
      .select('*')
      .match({ course_id: courseId, organization_id: organizationId });

    if (fileError) {
      console.error('[upsertPublishCourse] Failed to fetch course files:', fileError);
      return {
        success: false,
        message: 'Failed to fetch course files.',
      };
    }

    if (fileData && fileData.length > 0) {
      const copyResults = [];
      const failedCopies = [];

      for (const file of fileData) {
        if (!file.path) continue;

        const { error: copyFileError } = await supabase.storage
          .from(FILE_LIBRARY_BUCKET)
          .copy(file.path, file.path, { destinationBucket: PUBLISHED_FILE_LIBRARY_BUCKET });

        if (copyFileError)
          failedCopies.push({ id: file.id, path: file.path, error: copyFileError });
        else copyResults.push({ id: file.id, path: file.path });
      }

      if (failedCopies.length > 0) {
        console.error('[upsertPublishCourse] Failed to copy files:', failedCopies);
        return {
          success: copyResults.length > 0,
          message:
            copyResults.length > 0
              ? `Course published but ${failedCopies.length} of ${fileData.length} files failed to copy.`
              : 'Course published but all files failed to copy. Please try again.',
        };
      }

      // Insert copied files into published_file_library
      const { error: insertError } = await supabase.from('published_file_library').insert(fileData);
      if (insertError) {
        console.error(
          '[upsertPublishCourse] Failed to insert published file records:',
          insertError,
        );
        return {
          success: false,
          message: 'Files copied successfully but failed to create published file records.',
        };
      }

      console.log(`[upsertPublishCourse] Successfully copied ${copyResults.length} files`);
    }

    return { success: true, message: 'Course published successfully.' };
  } catch (err) {
    console.error('[upsertPublishCourse] Unexpected error:', err);
    return { success: false, message: 'An unexpected error occurred while publishing the course.' };
  }
};
