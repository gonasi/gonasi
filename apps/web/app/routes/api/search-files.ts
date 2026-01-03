import { fetchFilesWithSignedUrls } from '@gonasi/database/files';
import type { FileType } from '@gonasi/schemas/file';

import type { Route } from './+types/search-files';

import { createClient } from '~/lib/supabase/supabase.server';

type SearchFilesResponse = Awaited<ReturnType<typeof loader>>;
export type SearchFileResult = SearchFilesResponse['data'][number];

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const url = new URL(request.url);

  const searchQuery = url.searchParams.get('name') ?? '';
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const limit = 12;

  // Handle multiple fileType parameters
  const fileTypes = url.searchParams.getAll('fileType').filter(Boolean);

  // If no file types specified, pass undefined to fetch all
  const fileTypeParam = fileTypes.length > 0 ? fileTypes : undefined;

  const data = await fetchFilesWithSignedUrls({
    supabase,
    courseId: params.courseId,
    searchQuery,
    limit,
    page,
    fileTypes: fileTypeParam as FileType[] | undefined,
  });

  return data;
}
