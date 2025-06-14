import { Outlet } from 'react-router';
import { Plus } from 'lucide-react';

import { fetchFilesWithSignedUrls } from '@gonasi/database/files';

import type { Route } from './+types/file-library-index';

import { NotFoundCard } from '~/components/cards';
import FileRenderer from '~/components/file-renderers/file-renderer';
import { PaginationBar } from '~/components/search-params/pagination-bar';
import { SearchInput } from '~/components/search-params/search-input';
import { FloatingActionButton } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';

export type FileLoaderReturnType = Exclude<Awaited<ReturnType<typeof loader>>, Response>['data'];

export type FileLoaderItemType = FileLoaderReturnType['data'][number];

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const url = new URL(request.url);

  const searchQuery = url.searchParams.get('name') || '';
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = 12;

  const data = await fetchFilesWithSignedUrls({
    supabase,
    courseId: params.courseId,
    searchQuery,
    limit,
    page,
  });

  return { data };
}

export default function AllFiles({ loaderData, params }: Route.ComponentProps) {
  const {
    data: { data, count },
  } = loaderData;

  return (
    <div className='mx-auto max-w-3xl pb-20'>
      {/* <StorageIndicator /> */}
      <div className='pb-4'>
        <SearchInput placeholder='Search for course files...' />
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
      {/* Floating button to add a new chapter */}
      <FloatingActionButton
        to={`/${params.username}/course-builder/${params.courseId}/file-library/new`}
        tooltip='Add new file'
        icon={<Plus size={20} strokeWidth={4} />}
      />
      <Outlet />
    </div>
  );
}
