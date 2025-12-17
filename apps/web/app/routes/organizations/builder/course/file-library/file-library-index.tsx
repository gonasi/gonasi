// AllFiles.tsx
import { Suspense } from 'react';
import { Await, Outlet } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { redirectWithError } from 'remix-toast';

import { fetchFilesWithSignedUrls } from '@gonasi/database/files';
import {
  fetchOrganizationTierLimits,
  getOrganizationStorageUsage,
} from '@gonasi/database/organizations';

import type { Route } from './+types/file-library-index';

import { BannerCard, NotFoundCard } from '~/components/cards';
import FileRenderer from '~/components/file-renderers/file-renderer';
import { PaginationBar } from '~/components/search-params/pagination-bar';
import { SearchInput } from '~/components/search-params/search-input';
import { FloatingActionButton, NavLinkButton } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';
import { formatBytes } from '~/utils/formatBytes';

export type FileLoaderReturnType = Exclude<Awaited<ReturnType<typeof loader>>, Response>['data'];
export type FileLoaderItemType = FileLoaderReturnType['data'][number];

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const url = new URL(request.url);

  const searchQuery = url.searchParams.get('name') ?? '';
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const limit = 12;

  const [data, canEditResult, tierLimits] = await Promise.all([
    fetchFilesWithSignedUrls({
      supabase,
      courseId: params.courseId,
      transformOptions: {
        width: 600, // Increased from 150 for better quality
        quality: 80, // Slightly higher quality
      },
      searchQuery,
      limit,
      page,
    }),
    supabase.rpc('can_user_edit_course', {
      arg_course_id: params.courseId,
    }),
    fetchOrganizationTierLimits({
      supabase,
      organizationId: params.organizationId,
    }),
  ]);

  if (!tierLimits) {
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/overview`,
      'Could not fetch organization tier data',
    );
  }

  const organizationStorageUsage = getOrganizationStorageUsage({
    supabase,
    organizationId: params.organizationId,
    allowedStorageMB: tierLimits?.storage_limit_mb_per_org,
  });

  return { data, storageUsage: organizationStorageUsage, canEdit: Boolean(canEditResult.data) };
}

export default function AllFiles({ loaderData, params }: Route.ComponentProps) {
  const {
    data: { data, count },
    canEdit,
    storageUsage,
  } = loaderData;

  if (!canEdit) {
    return (
      <BannerCard
        showCloseIcon={false}
        variant='restricted'
        message='Files Library'
        description={`You don't have permission to view or manage this course's files. Please contact an administrator for access.`}
        className='mt-4 md:mt-0'
      />
    );
  }

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

      {/* Storage Usage */}
      <Suspense
        fallback={
          <div className='bg-card mb-4 animate-pulse space-y-4 rounded-md p-4 shadow-sm'>
            <div className='h-4 w-1/4 rounded bg-gray-300' />
            <div className='h-2 rounded bg-gray-300' />
            <div className='flex justify-between text-xs'>
              <div className='h-3 w-1/6 rounded bg-gray-300' />
              <div className='h-3 w-1/4 rounded bg-gray-300' />
            </div>
            <div className='mt-2 h-4 rounded bg-gray-200' />
          </div>
        }
      >
        <Await
          resolve={storageUsage}
          errorElement={
            <div className='bg-card text-danger mb-4 rounded-md p-4 shadow-sm'>
              Failed to load storage usage. Please try again later.
            </div>
          }
        >
          {(storage) => {
            const {
              allowed_bytes,
              used_bytes,
              remaining_bytes,
              percentage_used,
              exceeded_limit,
              breakdown,
            } = storage;

            const percentUsed = Math.min(percentage_used, 100);
            const publishedPercent = (breakdown.publishedFileLibraryBytes / allowed_bytes) * 100;
            const unpublishedPercent = (breakdown.fileLibraryBytes / allowed_bytes) * 100;

            return (
              <div className='bg-card mb-4 space-y-4 rounded-md p-4 shadow-sm'>
                <div className='text-muted-foreground text-sm font-semibold'>
                  Total Org Storage Overview
                </div>

                {/* Overall Usage with Published vs Unpublished Side-by-Side */}
                <div className='space-y-2'>
                  <div className='text-muted-foreground flex justify-between text-xs'>
                    <span>{formatBytes(used_bytes)} used</span>
                    <span>
                      {formatBytes(remaining_bytes)} free of {formatBytes(allowed_bytes)}
                    </span>
                  </div>

                  <div className='relative h-1 w-full overflow-hidden rounded bg-gray-200'>
                    {/* Published Portion */}
                    <div
                      className='bg-primary absolute top-0 left-0 h-full'
                      style={{ width: `${publishedPercent}%` }}
                    />
                    {/* Unpublished Portion */}
                    <div
                      className='bg-secondary absolute top-0 h-full'
                      style={{
                        left: `${publishedPercent}%`,
                        width: `${unpublishedPercent}%`,
                      }}
                    />
                  </div>

                  {/* Legend */}
                  <div className='mt-1 flex justify-start gap-4 text-xs'>
                    <div className='flex items-center gap-1'>
                      <div className='bg-primary font-secondary h-3 w-3 rounded-sm' />
                      <span className='pt-1'>
                        Published: {formatBytes(breakdown.publishedFileLibraryBytes)}
                      </span>
                    </div>
                    <div className='font-secondary flex items-center gap-1'>
                      <div className='bg-secondary h-3 w-3 rounded-sm' />
                      <span className='pt-1'>
                        Unpublished: {formatBytes(breakdown.fileLibraryBytes)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alerts */}
                {exceeded_limit && (
                  <div className='text-danger font-secondary mt-2 text-sm font-bold'>
                    You have exceeded your storage limit! Please upgrade to continue uploading.
                  </div>
                )}

                {percentUsed > 80 && (
                  <NavLinkButton to={`/${params.organizationId}/dashboard/subscriptions`}>
                    Upgrade Storage
                  </NavLinkButton>
                )}
              </div>
            );
          }}
        </Await>
      </Suspense>

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
