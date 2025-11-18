import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Search, X } from 'lucide-react';

import { fetchFilesWithSignedUrls } from '@gonasi/database/files';
import type { FileType } from '@gonasi/schemas/file';

import type { InsertImagePayload } from './ImagesPlugin';

import FileRenderer from '~/components/file-renderers/file-renderer';
import { Spinner } from '~/components/loaders';
import { PlainButton } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { supabaseClient } from '~/lib/supabase/supabaseClient';
import type { FileLoaderReturnType } from '~/routes/organizations/builder/course/file-library/file-library-index';

export type InsertFilePayload = InsertImagePayload;

export function InsertFileDialog({
  handleFileInsert,
  fileType,
}: {
  handleFileInsert: (payload: InsertFilePayload) => void;
  fileType: FileType;
}): React.JSX.Element {
  const params = useParams();

  // File-related states
  const [files, setFiles] = useState<FileLoaderReturnType>({ count: 0, data: [] });
  const [loading, setLoading] = useState(true);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load more files (pagination)
  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [loading, loadingMore, hasMore]);

  // Manual search trigger
  const handleSearch = useCallback(() => {
    setPage(1);
    if (searchQuery !== debouncedSearchQuery) {
      setFiles({ count: 0, data: [] });
    }
    setDebouncedSearchQuery(searchQuery);
  }, [searchQuery, debouncedSearchQuery]);

  // Debounced search (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== debouncedSearchQuery) {
        handleSearch();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearchQuery, handleSearch]);

  // Initial fetch or when search changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fetchedFiles = await fetchFilesWithSignedUrls({
          supabase: supabaseClient,
          fileType,
          courseId: params.courseId ?? '',
          searchQuery: debouncedSearchQuery,
          limit,
          page: 1,
        });

        setFiles(fetchedFiles);
        setHasMore(fetchedFiles.data.length === limit && fetchedFiles.count > limit);
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedSearchQuery, limit, params.courseId, fileType]);

  // Fetch more when pagination changes
  useEffect(() => {
    const fetchMoreData = async () => {
      setLoadingMore(true);
      try {
        const fetchedFiles = await fetchFilesWithSignedUrls({
          supabase: supabaseClient,
          courseId: params.courseId ?? '',
          searchQuery: debouncedSearchQuery,
          limit,
          page,
          fileType,
        });

        setFiles((prev) => ({
          count: fetchedFiles.count,
          data: [...prev.data, ...fetchedFiles.data],
        }));

        setHasMore(
          fetchedFiles.data.length === limit &&
            files.data.length + fetchedFiles.data.length < fetchedFiles.count,
        );
      } catch (error) {
        console.error('Error fetching more files:', error);
      } finally {
        setLoadingMore(false);
      }
    };

    fetchMoreData();
  }, [params.courseId, page, limit, debouncedSearchQuery, files.data.length, fileType]);

  return (
    <div className='flex flex-col space-y-4'>
      {/* 🔍 Search Input */}
      <div className='relative'>
        <Input
          type='text'
          placeholder='Search files...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          className='rounded-full'
        />
        <div className='absolute top-2.5 right-3 flex gap-1'>
          {searchQuery && (
            <PlainButton
              onClick={() => {
                setSearchQuery('');
                setDebouncedSearchQuery('');
              }}
            >
              <X />
            </PlainButton>
          )}
          <PlainButton onClick={handleSearch}>
            <Search />
          </PlainButton>
        </div>
      </div>

      {/* 🔄 Loading Spinner (initial load) */}
      {loading && page === 1 ? (
        <div className='flex h-40 items-center justify-center'>
          <Spinner />
        </div>
      ) : (
        <>
          {/* 📁 Files Grid */}
          {files.data.length > 0 ? (
            <div className='mb-4'>
              <h3 className='mb-2 text-lg font-medium'>
                {files.count > 0 ? `Available Files (${files.count})` : 'Available Files'}
              </h3>

              <div className='grid grid-cols-2 gap-6 md:grid-cols-3'>
                {files.data.map((file) => (
                  <PlainButton
                    key={file.id}
                    onClick={() =>
                      handleFileInsert({ fileId: file.id, blurHash: file.blur_preview ?? '' })
                    }
                    className='h-full w-full'
                  >
                    <FileRenderer file={file} canEdit={false} />
                  </PlainButton>
                ))}
              </div>

              {/* ⬇️ Load More Button */}
              {hasMore && (
                <div className='mt-6 flex justify-center'>
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className='inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50'
                  >
                    {loadingMore ? <Spinner /> : 'Load More Files'}
                  </button>
                </div>
              )}

              {/* 🔄 Spinner during additional loading */}
              {loadingMore && !hasMore && (
                <div className='mt-4 flex justify-center py-2'>
                  <Spinner />
                </div>
              )}

              {/* ✅ End of File List Message */}
              {!hasMore && files.data.length > 0 && (
                <p className='text-muted-foreground mt-4 text-center text-sm'>
                  No more files to load
                </p>
              )}
            </div>
          ) : (
            // ❌ No Files Found
            <div className='flex h-40 items-center justify-center'>
              <p className='text-muted-foreground'>
                {debouncedSearchQuery
                  ? `No files found in this course matching "${debouncedSearchQuery}". You can upload one to get started!`
                  : 'This course doesn’t have any files yet — feel free to upload one!'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
