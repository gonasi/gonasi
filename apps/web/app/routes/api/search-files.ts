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
  const fileType = url.searchParams.get('fileType') ?? '';
  const limit = 12;

  const data = await fetchFilesWithSignedUrls({
    supabase,
    courseId: params.courseId,
    searchQuery,
    limit,
    page,
    fileType: fileType as FileType,
  });

  return data;
}
