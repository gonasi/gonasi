import { Outlet } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
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

  const searchQuery = url.searchParams.get('name') ?? '';
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const limit = 12;

  const [data, canEditResult] = await Promise.all([
    fetchFilesWithSignedUrls({
      supabase,
      courseId: params.courseId,
      searchQuery,
      limit,
      page,
    }),
    supabase.rpc('can_user_edit_course', {
      arg_course_id: params.courseId,
    }),
  ]);

  return { data, canEdit: Boolean(canEditResult.data) };
}

export default function AllFiles({ loaderData, params }: Route.ComponentProps) {
  const {
    data: { data, count },
    canEdit,
  } = loaderData;

  return (
    <div>
      {/* Search Input fade-in */}
      <motion.div
        className='pb-4'
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SearchInput placeholder='Search for course files...' />
      </motion.div>

      {data && data.length > 0 ? (
        <div className='flex flex-col space-y-4'>
          <motion.div
            className='grid grid-cols-2 gap-1 lg:grid-cols-4'
            initial='hidden'
            animate='visible'
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
          >
            <AnimatePresence>
              {data.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <FileRenderer file={file} canEdit={canEdit} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Pagination bar fade-in */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className='pb-8'
          >
            <PaginationBar totalItems={count ?? 0} itemsPerPage={12} />
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <NotFoundCard message='No files found' />
        </motion.div>
      )}

      {canEdit && (
        <FloatingActionButton
          to={`/${params.organizationId}/builder/${params.courseId}/file-library/new`}
          tooltip='Add new file'
          icon={<Plus size={20} strokeWidth={4} />}
        />
      )}

      <Outlet />
    </div>
  );
}
