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

    // Delete from published_file_library
    await supabase.from('published_file_library').delete().match({
      course_id: courseId,
      organization_id: organizationId,
    });

    const { error: deleteError } = await deleteAllPublishedFilesInFolder({
      supabase,
      organizationId,
      courseId,
    });

    console.error('[upsertPublishCourse] Failed to delete course files:', deleteError);

    // Fetch all files for this course
    const { data: fileData, error: fileError } = await supabase
      .from('file_library')
      .select('*') // Select all columns to copy the complete record
      .match({
        course_id: courseId,
        organization_id: organizationId,
      });

    if (fileError) {
      console.error('[upsertPublishCourse] Failed to fetch course files:', fileError);
      return {
        success: false,
        message: 'Failed to fetch course files.',
      };
    }

    // Handle file copying if there are files to copy
    if (fileData && fileData.length > 0) {
      const copyResults = [];
      const failedCopies = [];

      // Loop through each file and copy it
      for (const file of fileData) {
        if (!file.path) {
          console.warn('[upsertPublishCourse] Skipping file with empty path:', file.id);
          continue;
        }

        const { error: copyFileError } = await supabase.storage
          .from(FILE_LIBRARY_BUCKET)
          .copy(file.path, file.path, {
            destinationBucket: PUBLISHED_FILE_LIBRARY_BUCKET,
          });

        if (copyFileError) {
          console.error('[upsertPublishCourse] File copy error for', file.path, ':', copyFileError);
          failedCopies.push({ id: file.id, path: file.path, error: copyFileError });
        } else {
          copyResults.push({ id: file.id, path: file.path });
        }
      }

      // Check if any copies failed
      if (failedCopies.length > 0) {
        console.error('[upsertPublishCourse] Failed to copy files:', failedCopies);

        // Return partial success message if some files copied successfully
        if (copyResults.length > 0) {
          return {
            success: false,
            message: `Course published but ${failedCopies.length} of ${fileData.length} files failed to copy. Successfully copied: ${copyResults.length} files.`,
          };
        } else {
          return {
            success: false,
            message: 'Course published but all files failed to copy. Please try again.',
          };
        }
      }

      // Insert successfully copied files into published_file_library
      if (fileData.length > 0) {
        const { error: insertError } = await supabase
          .from('published_file_library')
          .insert(fileData);

        if (insertError) {
          console.error('[upsertPublishCourse] Failed to insert file records:', insertError);
          return {
            success: false,
            message:
              'Files copied successfully but failed to create published file records. Please try again.',
          };
        }
      }

      console.log(`[upsertPublishCourse] Successfully copied ${copyResults.length} files`);
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
