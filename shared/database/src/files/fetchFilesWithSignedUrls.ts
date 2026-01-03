import { getBlurPlaceholderUrl, getSignedUrl } from '@gonasi/cloudinary';
import type { FileType } from '@gonasi/schemas/file';

import { getPaginationRange } from '../constants/utils';
import type { FetchDataParams } from '../types';

interface FetchFilesParams extends FetchDataParams {
  courseId: string;
  fileTypes?: FileType[]; // Changed to array
  transformOptions?: { width?: number; height?: number; quality?: number }; // optional for images
}

export async function fetchFilesWithSignedUrls({
  supabase,
  courseId,
  searchQuery = '',
  limit = 12,
  page = 1,
  fileTypes, // Now accepts an array
  transformOptions,
}: FetchFilesParams) {
  const { startIndex, endIndex } = getPaginationRange(page, limit);

  // Build query
  let query = supabase
    .from('file_library')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .eq('course_id', courseId);

  // Handle multiple file types with IN clause
  if (fileTypes && fileTypes.length > 0) {
    query = query.in('file_type', fileTypes);
  }

  if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);
  query = query.range(startIndex, endIndex);

  // Fetch files
  const { data, count, error } = await query;
  if (error) throw new Error(`Fetch error: ${error.message}`);
  if (!data || data.length === 0) return { count: 0, data: [] };

  // Generate Cloudinary signed URLs for each file
  const filesWithUrls = data.map((file) => {
    const resourceType =
      file.file_type === 'video' ? 'video' : file.file_type === 'image' ? 'image' : 'raw';

    // Use updated_at timestamp as version for cache busting
    // This ensures edited files get fresh URLs instead of cached versions
    const cacheVersion = file.updated_at ? new Date(file.updated_at).getTime() : undefined;

    // Generate SIGNED URL with 1-hour expiration (private access)
    const signedUrl = getSignedUrl(file.path, {
      width: transformOptions?.width ?? 200,
      height: transformOptions?.height,
      quality: transformOptions?.quality ?? 70,
      format: 'auto',
      expiresInSeconds: 3600, // 1 hour (same as Supabase)
      resourceType,
      version: cacheVersion, // CRITICAL: Cache busting
    });

    // Generate blur placeholder URL for images (for progressive loading)
    const blurUrl = file.file_type === 'image' ? getBlurPlaceholderUrl(file.path, 3600) : null;

    return { ...file, signed_url: signedUrl, blur_url: blurUrl };
  });

  return {
    count: count || 0,
    data: filesWithUrls,
  };
}
