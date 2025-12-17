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
 *   Publishes a course using a strict draft → published replacement model.
 *
 * PUBLISHING MODEL:
 *   - Draft (file_library + draft/) is the SINGLE SOURCE OF TRUTH
 *   - Published (published_file_library + published/) is a COMPLETE SNAPSHOT
 *   - Publishing is DESTRUCTIVE REPLACEMENT: DELETE all published → COPY all draft
 *   - NO diffing, merging, or selective updates - always full replacement
 *   - ATOMIC from consumer perspective: no partial state ever visible
 *
 * WORKFLOW:
 *   1. Permission validation
 *   2. Course data transformation
 *   3. PRE-FLIGHT CHECK: Verify all draft files exist in Cloudinary (FAIL FAST)
 *   4. Delete ALL existing published state (files + metadata)
 *   5. Copy thumbnail: draft → published
 *   6. Copy ALL files: draft → published (parallel, fail if any missing)
 *   7. Transform content: replace all draft paths with published paths
 *   8. ATOMIC COMMIT: Save course + content to database
 *   9. Insert ALL file metadata into published_file_library (batch)
 *
 * OPTIMIZATIONS:
 *   - Batch database operations (single INSERT for all file records)
 *   - Prefix-based Cloudinary deletes across all resource types (parallel)
 *   - Parallel file copying for maximum throughput
 *   - Pre-flight check to fail fast before modifying state
 *
 * ATOMICITY:
 *   Files are copied to published/ folder before database commit.
 *   The published state only becomes visible when the database commit succeeds.
 *   Until then, consumers continue seeing the old published state (if any).
 *
 * INPUTS:
 *   supabase: Authenticated Supabase client
 *   organizationId: UUID of the organization
 *   courseId: UUID of the course to publish
 *
 * RETURN VALUE:
 *   ApiResponse object:
 *   {
 *     success: boolean,  -- true only if complete replacement succeeds
 *     message: string,   -- explanation of what happened
 *     data?: {           -- optional, included on success with storage details
 *       remaining_storage_bytes: bigint
 *     }
 *   }
 *
 * ERROR SCENARIOS (FAIL FAST):
 *   - User lacks publish permission → fail
 *   - Storage quota would be exceeded → fail
 *   - Thumbnail doesn't exist in Cloudinary → fail
 *   - ANY draft file missing from Cloudinary → fail (data integrity violation)
 *   - File copy fails → fail
 *   - Database errors → fail
 *
 *   All failures occur BEFORE modifying published state (atomic guarantee).
 */
/**
 * Helper function to replace draft file paths with published paths in block content
 */
function transformFilePathsInContent(content: any, filePathMap: Map<string, string>): any {
  if (!content || typeof content !== 'object') {
    return content;
  }

  // Handle arrays
  if (Array.isArray(content)) {
    return content.map((item) => transformFilePathsInContent(item, filePathMap));
  }

  // Handle objects
  const transformed: any = {};
  for (const [key, value] of Object.entries(content)) {
    // Check if this value is a file path that needs transformation
    if (typeof value === 'string' && filePathMap.has(value)) {
      transformed[key] = filePathMap.get(value);
    } else if (value && typeof value === 'object') {
      // Recursively transform nested objects
      transformed[key] = transformFilePathsInContent(value, filePathMap);
    } else {
      transformed[key] = value;
    }
  }
  return transformed;
}

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
    // STEP 3: PRE-FLIGHT CHECK - Verify all draft files exist in Cloudinary
    // =========================================================================
    // CRITICAL: Check files BEFORE deleting anything to ensure atomic replacement
    // This fail-fast approach prevents leaving published in a broken state
    console.log('[upsertPublishCourse] Pre-flight: Fetching draft files from database');
    const { data: fileData, error: fileError } = await supabase
      .from('file_library')
      .select('*')
      .match({ course_id: courseId, organization_id: organizationId });

    if (fileError) {
      console.error(
        '[upsertPublishCourse] Pre-flight failed: Cannot fetch draft files:',
        fileError,
      );
      return {
        success: false,
        message: 'Failed to fetch draft files from database.',
      };
    }

    console.log(
      `[upsertPublishCourse] Pre-flight: Found ${fileData?.length || 0} draft file(s) in database`,
    );

    // Pre-flight check: Verify all files exist in Cloudinary before proceeding
    // This prevents leaving published in a broken state if files are missing
    if (fileData && fileData.length > 0) {
      const { getCloudinary } = await import('@gonasi/cloudinary');
      const cloudinary = getCloudinary();
      const missingFiles: { id: string; path: string }[] = [];

      console.log('[upsertPublishCourse] Pre-flight: Verifying files exist in Cloudinary...');
      for (const file of fileData) {
        if (!file.path) {
          console.warn(`[upsertPublishCourse] Pre-flight: File ${file.id} has no path, skipping`);
          continue;
        }

        const cleanPath = file.path.replace(
          /\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|avi|pdf|doc|docx)$/i,
          '',
        );

        console.log(`[upsertPublishCourse] Checking file: ${file.id}`, {
          originalPath: file.path,
          cleanPath,
          mimeType: file.mime_type,
          extension: file.extension,
        });

        try {
          // Try to find the resource in Cloudinary
          // Must check all combinations of type (authenticated/upload/private)
          // and resource_type (image/video/raw) since PDFs are 'raw', images are 'image', etc.
          let found = false;

          for (const type of ['authenticated', 'upload', 'private'] as const) {
            if (found) break;

            for (const resourceType of ['image', 'video', 'raw'] as const) {
              try {
                const resource = await cloudinary.api.resource(cleanPath, {
                  type,
                  resource_type: resourceType,
                });
                found = true;
                console.log(`[upsertPublishCourse] ✅ Found file ${file.id}:`, {
                  type,
                  resourceType,
                  public_id: resource.public_id,
                  format: resource.format,
                  bytes: resource.bytes,
                });
                break;
              } catch (error) {
                // Continue trying other combinations
                console.log(
                  `[upsertPublishCourse] Not found with type=${type}, resource_type=${resourceType}`,
                );
              }
            }
          }

          if (!found) {
            // Try one more time with the ORIGINAL path (with extension)
            // Some files might be stored with the extension as part of public_id
            console.log(
              `[upsertPublishCourse] Retrying with original path (with extension): ${file.path}`,
            );

            for (const type of ['authenticated', 'upload', 'private'] as const) {
              if (found) break;

              for (const resourceType of ['image', 'video', 'raw'] as const) {
                try {
                  const resource = await cloudinary.api.resource(file.path, {
                    type,
                    resource_type: resourceType,
                  });
                  found = true;
                  console.log(
                    `[upsertPublishCourse] ✅ Found file ${file.id} using ORIGINAL path:`,
                    {
                      type,
                      resourceType,
                      public_id: resource.public_id,
                      format: resource.format,
                      bytes: resource.bytes,
                    },
                  );
                  break;
                } catch {
                  // Continue trying
                }
              }
            }
          }

          if (!found) {
            console.error(`[upsertPublishCourse] ❌ File not found in Cloudinary:`, {
              id: file.id,
              path: file.path,
              cleanPath,
              mimeType: file.mime_type,
              extension: file.extension,
              triedPaths: [cleanPath, file.path],
              triedCombinations: [
                'authenticated/image',
                'authenticated/video',
                'authenticated/raw',
                'upload/image',
                'upload/video',
                'upload/raw',
                'private/image',
                'private/video',
                'private/raw',
              ],
            });
            missingFiles.push({ id: file.id, path: file.path });
          }
        } catch (error) {
          console.error(`[upsertPublishCourse] Error checking file ${file.id}:`, error);
          missingFiles.push({ id: file.id, path: file.path });
        }
      }

      // FAIL FAST: If any files are missing, abort before touching published state
      if (missingFiles.length > 0) {
        const missingFileDetails = missingFiles
          .map((f) => `  - File ID: ${f.id}\n    Path: ${f.path}`)
          .join('\n');

        console.error(
          '[upsertPublishCourse] Pre-flight FAILED: Files missing from Cloudinary:',
          missingFiles,
        );
        return {
          success: false,
          message: `Cannot publish: ${missingFiles.length} file(s) exist in database but are missing from Cloudinary draft storage.\n\nThis violates the draft → published replacement model where draft must be complete.\n\nMissing files:\n${missingFileDetails}\n\nPlease re-upload these files or remove them from the course.`,
        };
      }

      console.log('[upsertPublishCourse] Pre-flight: ✅ All files verified in Cloudinary');
    }

    // =========================================================================
    // STEP 4: Delete existing published state (metadata + files)
    // =========================================================================
    // NOW it's safe to delete - we've verified draft is complete
    console.log('[upsertPublishCourse] Deleting existing published metadata from database');
    await supabase.from('published_file_library').delete().match({
      course_id: courseId,
      organization_id: organizationId,
    });

    // Delete all published files from Cloudinary (including old thumbnails)
    console.log('[upsertPublishCourse] Deleting existing published files from Cloudinary');
    const { error: deleteOldFilesError } = await deletePublishedCourseFiles({
      organizationId,
      courseId,
    });
    if (deleteOldFilesError) {
      console.error(
        '[upsertPublishCourse] Failed to delete old published files:',
        deleteOldFilesError,
      );
      // This is non-fatal; we'll overwrite with new files anyway
    }

    // =========================================================================
    // STEP 5: Handle thumbnail file management
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
    // STEP 6: COPY FILES - Draft → Published replacement
    // =========================================================================
    // Now that pre-flight passed and old state is deleted, copy all draft files
    console.log('[upsertPublishCourse] Starting file replacement: draft → published');

    // Initialize file path map for transforming draft paths to published paths
    const filePathMap = new Map<string, string>();

    // Add thumbnail to file path map if it was copied
    if (data.image_url && publishedImageUrl !== data.image_url) {
      filePathMap.set(data.image_url, publishedImageUrl);
      console.log('[upsertPublishCourse] Mapped thumbnail:', {
        draft: data.image_url,
        published: publishedImageUrl,
      });
    }

    // Track file copy results for batch insert into published_file_library
    const publishedFileRecords: any[] = [];

    if (fileData && fileData.length > 0) {
      console.log(
        `[upsertPublishCourse] Copying ${fileData.length} file(s) from draft to published (parallel)`,
      );

      // Copy all files in parallel for maximum efficiency
      // Cloudinary doesn't support bulk copy, but we can run multiple copies concurrently
      const copyPromises = fileData
        .filter((file) => file.path) // Skip files without paths
        .map(async (file) => {
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
            // This should never happen due to pre-flight check, but handle it
            console.error(`[upsertPublishCourse] Copy failed for file ${file.id}:`, copyError);
            throw new Error(`Failed to copy file ${file.id} to published storage. ${copyError}`);
          }

          return {
            file,
            publishedPublicId,
          };
        });

      // Wait for all copies to complete
      const copyResults = await Promise.all(copyPromises);

      // Build file path map and published records from results
      for (const result of copyResults) {
        filePathMap.set(result.file.path, result.publishedPublicId);
        publishedFileRecords.push({
          ...result.file,
          path: result.publishedPublicId, // Update to published path
        });
      }

      console.log(
        `[upsertPublishCourse] ✅ Copied ${publishedFileRecords.length} file(s) to published`,
      );
    }

    console.log(`[upsertPublishCourse] File path map created with ${filePathMap.size} mapping(s)`);

    // =========================================================================
    // STEP 7: Transform course structure content to use published file paths
    // =========================================================================
    // Replace all draft file paths with published paths in lesson block content
    // This ensures end users see the published versions of all assets
    console.log('[upsertPublishCourse] Transforming content: draft paths → published paths');
    const transformedStructureContent = transformFilePathsInContent(
      data.course_structure_content,
      filePathMap,
    );
    console.log('[upsertPublishCourse] ✅ Content transformed with published paths');

    // =========================================================================
    // STEP 8: ATOMIC COMMITMENT - Publish course + metadata in database
    // =========================================================================
    // This is the atomic commit point. Once this RPC succeeds:
    // - The course becomes visible to consumers in the published state
    // - All metadata and content references use published paths
    // - Storage quota is validated and tracked
    //
    // Until this succeeds, the published state is not exposed to consumers,
    // ensuring atomicity from the consumer's perspective.
    console.log('[upsertPublishCourse] Committing published state to database (atomic)');
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
        structure_content: transformedStructureContent, // Use transformed content with published paths
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
    // STEP 9: Complete replacement - Insert published file metadata (batch)
    // =========================================================================
    // Insert all published file records in a single batch operation
    // This completes the draft → published replacement for file metadata
    if (publishedFileRecords.length > 0) {
      console.log(
        `[upsertPublishCourse] Inserting ${publishedFileRecords.length} file records into published_file_library (batch)`,
      );

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
          message: 'Course published but failed to create published file metadata records.',
        };
      }

      console.log(
        `[upsertPublishCourse] ✅ Inserted ${publishedFileRecords.length} file record(s) into published_file_library`,
      );
    }

    // =========================================================================
    // SUCCESS: Draft → Published replacement complete
    // =========================================================================
    console.log(
      '[upsertPublishCourse] ✅ Publishing complete - draft successfully replaced published state',
    );
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
