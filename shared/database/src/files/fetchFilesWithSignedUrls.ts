import type { FileType } from '@gonasi/schemas/file';

import { FILE_LIBRARY_BUCKET } from '../constants';
import { getPaginationRange } from '../constants/utils';
import type { FetchDataParams } from '../types';

interface FetchFilesParams extends FetchDataParams {
  companyId: string;
}

export async function fetchFilesWithSignedUrls({
  supabase,
  companyId,
  searchQuery = '',
  limit = 12,
  page = 1,
}: FetchFilesParams) {
  // TODO: Implement user permission check

  const { startIndex, endIndex } = getPaginationRange(page, limit);

  let query = supabase
    .from('file_library')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .eq('company_id', companyId);

  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`);
  }

  query = query.range(startIndex, endIndex);

  const { data, count, error } = await query;

  if (error) throw new Error(`Fetch error: ${error.message}`);
  if (!data || data.length === 0) {
    return {
      count: 0,
      data: [],
    };
  }

  const files = await Promise.all(
    data.map(async (file) => {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(FILE_LIBRARY_BUCKET)
        .createSignedUrl(file.path, 3600);

      if (signedUrlError) {
        throw new Error(`Signed URL error: ${signedUrlError.message}`);
      }

      return {
        ...file,
        file_type: file.file_type as FileType,
        signed_url: signedUrlData?.signedUrl ?? null,
      };
    }),
  );

  return {
    count,
    data: files,
  };
}
