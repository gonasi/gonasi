import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import type { LexicalCommand } from 'lexical';
import { createCommand } from 'lexical';
import { Search, X } from 'lucide-react';

import { fetchFilesWithSignedUrls } from '@gonasi/database/files';

import type { FilePayload } from '../../nodes/FileNode';

import FileRenderer from '~/components/file-renderers/file-renderer';
import { Spinner } from '~/components/loaders';
import { PlainButton } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { createBrowserClient } from '~/lib/supabase/supabaseClient';
import type { FileLoaderReturnType } from '~/routes/dashboard/file-library/all-files';
import { useStore } from '~/store';

export type InsertFilePayload = Readonly<FilePayload>;

export const INSERT_FILE_COMMAND: LexicalCommand<InsertFilePayload> =
  createCommand('INSERT_FILE_COMMAND');

export function InsertFileDialogBody({
  handleFileInsert,
}: {
  handleFileInsert: (payload: InsertFilePayload) => void;
}): React.JSX.Element {
  const params = useParams();
  const { activeSession } = useStore();

  const supabase = React.useMemo(
    () => (activeSession ? createBrowserClient(activeSession) : null),
    [activeSession],
  );

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
      if (!supabase || !params.courseId) return;

      setLoading(true);
      try {
        const fetchedFiles = await fetchFilesWithSignedUrls({
          supabase,
          courseId: params.courseId,
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
  }, [supabase, debouncedSearchQuery, limit, params.courseId]);

  // Fetch more when pagination changes
  useEffect(() => {
    const fetchMoreData = async () => {
      if (!supabase || !params.courseId || page === 1) return;

      setLoadingMore(true);
      try {
        const fetchedFiles = await fetchFilesWithSignedUrls({
          supabase,
          courseId: params.courseId,
          searchQuery: debouncedSearchQuery,
          limit,
          page,
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
  }, [supabase, params.courseId, page, limit, debouncedSearchQuery, files.data.length]);

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
                    onClick={() => handleFileInsert({ fileId: file.id })}
                    className='h-full w-full'
                  >
                    <FileRenderer file={file} />
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
                <p className='mt-4 text-center text-sm text-gray-500'>No more files to load</p>
              )}
            </div>
          ) : (
            // ❌ No Files Found
            <div className='flex h-40 items-center justify-center'>
              <p className='text-gray-500'>
                {debouncedSearchQuery
                  ? `No files found matching "${debouncedSearchQuery}"`
                  : 'No files available'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
