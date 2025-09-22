import type { FileType } from '@gonasi/schemas/file';

import { FILE_LIBRARY_BUCKET } from '../constants';
import { getPaginationRange } from '../constants/utils';
import type { FetchDataParams } from '../types';

interface FetchFilesParams extends FetchDataParams {
  courseId: string;
  fileType?: FileType;
  transformOptions?: { width?: number; height?: number }; // optional for images
}

// Helper to batch sign files with optional transform and default aspect ratio
async function signFiles(
  supabase: any,
  paths: string[],
  transform?: { width?: number; height?: number },
) {
  if (paths.length === 0) return [];

  // Default transform: width = 200px, height undefined = preserve aspect ratio
  const defaultTransform = {
    width: transform?.width ?? 200,
    height: transform?.height, // undefined keeps original aspect ratio
  };

  const { data, error } = await supabase.storage
    .from(FILE_LIBRARY_BUCKET)
    .createSignedUrls(
      paths,
      3600,
      transform ? ({ transform: defaultTransform, format: 'webp' } as any) : undefined,
    );

  if (error) {
    console.error('Error signing URLs', error);
    return paths.map(() => ({ signedUrl: null }));
  }

  return data ?? paths.map(() => ({ signedUrl: null }));
}

export async function fetchFilesWithSignedUrls({
  supabase,
  courseId,
  searchQuery = '',
  limit = 12,
  page = 1,
  fileType,
  transformOptions,
}: FetchFilesParams) {
  const { startIndex, endIndex } = getPaginationRange(page, limit);

  // Build query
  let query = supabase
    .from('file_library')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .eq('course_id', courseId);

  if (fileType) query = query.eq('file_type', fileType);
  if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);
  query = query.range(startIndex, endIndex);

  // Fetch files
  const { data, count, error } = await query;
  if (error) throw new Error(`Fetch error: ${error.message}`);
  if (!data || data.length === 0) return { count: 0, data: [] };

  // Separate images and non-images
  const imageFiles = data.filter((f) => f.file_type === 'image');
  const otherFiles = data.filter((f) => f.file_type !== 'image');

  // Batch sign
  const signedImageUrls = await signFiles(
    supabase,
    imageFiles.map((f) => f.path),
    transformOptions,
  );
  const signedOtherUrls = await signFiles(
    supabase,
    otherFiles.map((f) => f.path),
  );

  // Map signed URLs back to files
  const filesWithUrls = data.map((file) => {
    if (file.file_type === 'image') {
      const index = imageFiles.findIndex((f) => f.path === file.path);
      return { ...file, signed_url: signedImageUrls[index]?.signedUrl ?? null };
    } else {
      const index = otherFiles.findIndex((f) => f.path === file.path);
      return { ...file, signed_url: signedOtherUrls[index]?.signedUrl ?? null };
    }
  });

  return {
    count: count || 0,
    data: filesWithUrls,
  };
}
