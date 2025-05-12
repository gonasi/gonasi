import { fetchFilesWithSignedUrls } from '@gonasi/database/files';

import type { Route } from './+types/all-files';
import FileRenderer from '../../../components/file-renderers/file-renderer';

import { NotFoundCard } from '~/components/cards';
import { ViewLayout } from '~/components/layouts/view';
import { PaginationBar } from '~/components/search-params/pagination-bar';
import { SearchInput } from '~/components/search-params/search-input';
import { createClient } from '~/lib/supabase/supabase.server';

export type FileLoaderReturnType = Exclude<Awaited<ReturnType<typeof loader>>, Response>['data'];

export type FileLoaderItemType = FileLoaderReturnType[number];

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const url = new URL(request.url);

  const searchQuery = url.searchParams.get('name') || '';
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = 12;

  const files = await fetchFilesWithSignedUrls({
    supabase,
    companyId: params.companyId,
    searchQuery,
    limit,
    page,
  });

  return files;
}

export default function AllFiles({ loaderData, params }: Route.ComponentProps) {
  const { data, count } = loaderData;

  return (
    <ViewLayout title='File Library' newLink={`/dashboard/${params.companyId}/file-library/new`}>
      <div className='pb-4'>
        <SearchInput placeholder='Search for files...' />
      </div>

      {data && data.length > 0 ? (
        <div className='flex flex-col space-y-4'>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {data.map((file) => (
              <FileRenderer key={file.id} file={file} />
            ))}
          </div>
          <PaginationBar totalItems={count ?? 0} itemsPerPage={12} />
        </div>
      ) : (
        <NotFoundCard message='No files found' />
      )}
    </ViewLayout>
  );
}
