import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils';
import type { LexicalCommand } from 'lexical';
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import { Search, X } from 'lucide-react';

import { fetchFilesWithSignedUrls } from '@gonasi/database/files';

import type { FilePayload } from '../../nodes/FileNode';
import { $createFileNode, FileNode } from '../../nodes/FileNode';

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

export default function FilesPlugin(): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([FileNode])) {
      throw new Error('FilesPlugin: FileNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<InsertFilePayload>(
        INSERT_FILE_COMMAND,
        (payload) => {
          const fileNode = $createFileNode(payload);
          $insertNodes([fileNode]);

          // Wrap in paragraph if at root level
          if ($isRootOrShadowRoot(fileNode.getParentOrThrow())) {
            $wrapNodeInElement(fileNode, $createParagraphNode).selectEnd();
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor]);

  return null;
}

export function InsertFileDialogBody({
  handleFileInsert,
}: {
  handleFileInsert: (payload: InsertFilePayload) => void;
}): React.JSX.Element {
  const params = useParams();
  const { activeSession } = useStore();

  // Initialize Supabase client
  const supabase = React.useMemo(
    () => (activeSession ? createBrowserClient(activeSession) : null),
    [activeSession],
  );

  const [files, setFiles] = useState<FileLoaderReturnType>({
    count: 0,
    data: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Pagination params
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Function to handle loading more files
  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [loading, loadingMore, hasMore]);

  const handleSearch = useCallback(() => {
    setPage(1);
    // Only clear files when explicitly searching
    if (searchQuery !== debouncedSearchQuery) {
      setFiles({ count: 0, data: [] });
    }
    setDebouncedSearchQuery(searchQuery);
  }, [searchQuery, debouncedSearchQuery]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== debouncedSearchQuery) {
        handleSearch();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearchQuery, handleSearch]);

  // Fetch files on initial load or search change
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase || !params.companyId) {
        return;
      }

      setLoading(true);
      try {
        const fetchedFiles = await fetchFilesWithSignedUrls({
          supabase,
          companyId: params.companyId,
          searchQuery: debouncedSearchQuery,
          limit,
          page: 1, // Always start with page 1 on new search
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
  }, [supabase, params.companyId, debouncedSearchQuery, limit]);

  // Load more data when page changes
  useEffect(() => {
    const fetchMoreData = async () => {
      if (!supabase || !params.companyId || page === 1) {
        return;
      }

      setLoadingMore(true);
      try {
        const fetchedFiles = await fetchFilesWithSignedUrls({
          supabase,
          companyId: params.companyId,
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
  }, [supabase, params.companyId, page, limit, debouncedSearchQuery, files.data.length]);

  return (
    <div className='flex flex-col space-y-4'>
      {/* Search input */}
      <div className='relative'>
        <Input
          type='text'
          placeholder='Search files...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
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

      {/* Initial loading spinner */}
      {loading && page === 1 ? (
        <div className='flex h-40 items-center justify-center'>
          <Spinner />
        </div>
      ) : (
        <>
          {files.data.length > 0 ? (
            <div className='mb-4'>
              <h3 className='mb-2 text-lg font-medium'>
                {files.count > 0 ? `Available Files (${files.count})` : 'Available Files'}
              </h3>

              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
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

              {/* Load More button */}
              {hasMore && (
                <div className='mt-6 flex justify-center'>
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className='inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50'
                  >
                    {loadingMore ? (
                      <>
                        <Spinner />
                      </>
                    ) : (
                      'Load More Files'
                    )}
                  </button>
                </div>
              )}

              {/* Loading indicator */}
              {loadingMore && !hasMore && (
                <div className='mt-4 flex justify-center py-2'>
                  <Spinner />
                </div>
              )}

              {/* No more files indicator */}
              {!hasMore && files.data.length > 0 && (
                <p className='mt-4 text-center text-sm text-gray-500'>No more files to load</p>
              )}
            </div>
          ) : (
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
