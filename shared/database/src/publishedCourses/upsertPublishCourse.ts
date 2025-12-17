import { copyToPublished, deletePublishedCourseFiles } from '@gonasi/cloudinary';

import { getUserId } from '../auth';
import type { TypedSupabaseClient } from '../client';
import type { ApiResponse } from '../types';
import { getTransformedDataToPublish } from './getTransformedDataToPublish';

interface UpsertPublishCourseArgs {
  supabase: TypedSupabaseClient;
  organizationId: string;
  courseId: string;
}

interface RpcResult {
  success: boolean;
  message?: string;
  data?: {
    net_size_change_bytes?: number;
    remaining_storage_bytes?: number;
  };
}

/**
 * FUNCTION: upsertPublishCourse
 *
 * PURPOSE:
 *   Publishes a course by coordinating multiple steps:
 *   1. Permission validation
 *   2. Course data transformation
 *   3. Thumbnail file management
 *   4. Database upsert with storage quota validation
 *   5. Course file copying and tracking
 *
 * WHAT THIS FUNCTION DOES:
 *   - Verifies the user has permission to publish the course
 *   - Fetches and transforms course data for publishing
 *   - Copies course thumbnail to published storage bucket
 *   - Calls the PL/pgSQL upsert_published_course_with_content function
 *     which validates storage quota before committing changes
 *   - Copies all course files to published storage
 *   - Creates records for published files in the database
 *
 * INPUTS:
 *   supabase: Authenticated Supabase client
 *   organizationId: UUID of the organization
 *   courseId: UUID of the course to publish
 *
 * RETURN VALUE:
 *   ApiResponse object:
 *   {
 *     success: boolean,  -- true if course published, false if any step failed
 *     message: string,   -- explanation of what happened
 *     data?: {           -- optional, included on success with storage details
 *       remaining_storage_bytes: bigint
 *     }
 *   }
 *
 * ERROR SCENARIOS:
 *   - User lacks publish permission → returns success: false
 *   - Storage quota would be exceeded → returns success: false with quota message
 *   - Thumbnail copy fails → returns success: false
 *   - Course files fail to copy → returns partial success (if some copied)
 *   - Database errors → returns success: false
 */
export const upsertPublishCourse = async ({
  supabase,
  organizationId,
  courseId,
}: UpsertPublishCourseArgs): Promise<ApiResponse> => {
  const userId = await getUserId(supabase);

  // =========================================================================
  // STEP 1: Check if user has permission to publish this course
  // =========================================================================
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

  // =========================================================================
  // STEP 2: Fetch and transform course data into publishing format
  // =========================================================================
  // This retrieves course metadata, structure, and prepares it for the
  // published_courses table. Data transformation includes enriching course
  // info with computed fields like structure overview and enrollment stats.
  const data = await getTransformedDataToPublish({ supabase, organizationId, courseId });

  try {
    // =========================================================================
    // STEP 3: Delete existing published files from previous publish
    // =========================================================================
    // IMPORTANT: Clean up old files BEFORE copying new ones
    // This ensures we don't delete files we just copied
    await supabase.from('published_file_library').delete().match({
      course_id: courseId,
      organization_id: organizationId,
    });

    // Delete all published files from Cloudinary (including old thumbnails)
    const { error: deleteOldFilesError } = await deletePublishedCourseFiles({
      organizationId,
      courseId,
    });
    if (deleteOldFilesError) {
      console.error(
        '[upsertPublishCourse] Failed to delete old published files:',
        deleteOldFilesError,
      );
      // This is non-fatal; we'll copy new files anyway
    }

    // =========================================================================
    // STEP 4: Handle thumbnail file management
    // =========================================================================
    // Copy course thumbnail from draft to published folder in Cloudinary
    // This maintains the authenticated type and creates an immutable published version

    let publishedImageUrl = data.image_url; // Default to draft path if no thumbnail

    // Only attempt to copy thumbnail if image_url exists
    if (data.image_url) {
      console.log('[upsertPublishCourse] Starting thumbnail copy:', {
        draftImageUrl: data.image_url,
        organizationId,
        courseId,
      });

      const {
        success: thumbnailCopySuccess,
        publishedPublicId,
        error: thumbnailCopyError,
      } = await copyToPublished(
        data.image_url, // Use the actual public_id where the file exists in Cloudinary
        {
          organizationId,
          courseId,
          fileId: 'thumbnail', // Special case for thumbnail
          resourceType: 'thumbnail', // Specify thumbnail type for correct published path
        },
      );

      console.log('[upsertPublishCourse] Thumbnail copy result:', {
        success: thumbnailCopySuccess,
        publishedPublicId,
        error: thumbnailCopyError,
      });

      if (!thumbnailCopySuccess) {
        console.error('[upsertPublishCourse] Thumbnail copy failed:', thumbnailCopyError);
        return {
          success: false,
          message: `Failed to copy course thumbnail to the published folder: ${thumbnailCopyError}`,
        };
      }

      // Use the published public_id for the published course
      publishedImageUrl = publishedPublicId ?? data.image_url;
      console.log('[upsertPublishCourse] Thumbnail copied successfully:', {
        draft: data.image_url,
        published: publishedImageUrl,
      });

      // Verify the published thumbnail exists in Cloudinary
      try {
        const { getCloudinary } = await import('@gonasi/cloudinary');
        const cloudinary = getCloudinary();
        const verifyResult = await cloudinary.api.resource(publishedImageUrl, {
          type: 'authenticated',
          resource_type: 'image',
        });
        console.log('[upsertPublishCourse] ✅ Published thumbnail verified in Cloudinary:', {
          publicId: verifyResult.public_id,
          format: verifyResult.format,
          bytes: verifyResult.bytes,
          url: verifyResult.secure_url,
          created: verifyResult.created_at,
        });
      } catch (verifyError) {
        console.error('[upsertPublishCourse] ❌ Failed to verify published thumbnail:', {
          error: verifyError instanceof Error ? verifyError.message : verifyError,
          publishedImageUrl,
        });
      }
    } else {
      console.warn('[upsertPublishCourse] No thumbnail to copy - image_url is empty');
    }

    // =========================================================================
    // STEP 5: Upsert published course with storage quota validation
    // =========================================================================
    // IMPORTANT: The PL/pgSQL function now:
    //   - Calculates storage impact of the course
    //   - Validates organization has sufficient quota
    //   - Returns detailed storage metrics on success
    //   - Returns quota error on failure (prevents partial publishes)
    //
    // We must check the returned data for success status and handle
    // quota violations before proceeding to file operations.
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'upsert_published_course_with_content',
      {
        course_data: {
          id: data.id,
          organization_id: data.organization_id ?? '',
          category_id: data.category_id,
          subcategory_id: data.subcategory_id,
          is_active: data.is_active,
          name: data.name,
          description: data.description,
          image_url: publishedImageUrl, // Use published path, not draft
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
      },
    );

    // Handle RPC execution errors (network, database connection issues)
    if (rpcError) {
      console.error('[upsertPublishCourse] RPC execution error:', rpcError);
      return {
        success: false,
        message: rpcError.message,
      };
    }

    // Handle RPC logical errors (permissions, validation, quota exceeded)
    // The PL/pgSQL function returns a JSONB response with success status
    const result = rpcResult as unknown as RpcResult;
    if (result && !result.success) {
      console.error('[upsertPublishCourse] RPC validation error:', result.message);
      return {
        success: false,
        message: result.message ?? 'Failed to publish course',
        data: result.data as any,
      };
    }

    // Log storage info on successful publish for monitoring
    if (result?.data) {
      console.log(
        `[upsertPublishCourse] Course published. Storage change: ${result.data.net_size_change_bytes} bytes, Remaining: ${result.data.remaining_storage_bytes} bytes`,
      );
    }

    // =========================================================================
    // STEP 6: Copy course files from draft to published folder in Cloudinary
    // =========================================================================
    // Fetch all files associated with this course in the draft bucket
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

      // Copy each file from draft to published folder in Cloudinary
      for (const file of fileData) {
        if (!file.path) continue;

        const {
          success: copySuccess,
          publishedPublicId,
          error: copyError,
        } = await copyToPublished(
          file.path, // Draft public_id
          {
            organizationId,
            courseId,
            fileId: file.id,
          },
        );

        if (!copySuccess || !publishedPublicId) {
          failedCopies.push({
            id: file.id,
            path: file.path,
            error: copyError ?? 'Published public_id missing',
          });
        } else {
          copyResults.push({
            ...file,
            path: publishedPublicId, // Update to published public_id (guaranteed to be string)
          });
        }
      }

      // If some files failed to copy, decide whether to proceed or fail
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

      // =========================================================================
      // STEP 7: Create database records for copied files with published paths
      // =========================================================================
      // Track the published files in the database so we can retrieve them later
      const publishedFileRecords = copyResults.map((file) => ({
        ...file,
        path: file.path, // Already updated to published public_id
      }));

      const { error: insertError } = await supabase
        .from('published_file_library')
        .insert(publishedFileRecords);
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

    // =========================================================================
    // SUCCESS: Return detailed success response
    // =========================================================================
    return {
      success: true,
      message: 'Course published successfully.',
      data: result as any, // Include storage metrics from PL/pgSQL function
    };
  } catch (err) {
    console.error('[upsertPublishCourse] Unexpected error:', err);
    return {
      success: false,
      message: 'An unexpected error occurred while publishing the course.',
    };
  }
};
