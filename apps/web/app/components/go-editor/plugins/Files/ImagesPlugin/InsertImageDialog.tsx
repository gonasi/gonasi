import { type JSX, useEffect, useRef } from 'react';
import { useFetcher, useParams, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import type { LexicalEditor } from 'lexical';

import { FileType } from '@gonasi/schemas/file';

import { INSERT_IMAGE_COMMAND, type InsertImagePayload } from '.';

import FileRenderer from '~/components/file-renderers/file-renderer';
import { Spinner } from '~/components/loaders';
import { SearchInput } from '~/components/search-params/search-input';
import { PlainButton } from '~/components/ui/button';
import type { loader, SearchFileResult } from '~/routes/api/search-files';

export default function InsertImageDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const params = useParams();
  const fetcher = useFetcher<typeof loader>();
  const [searchParams] = useSearchParams();
  const initialLoadRef = useRef(false);
  const hasModifier = useRef(false);

  useEffect(() => {
    hasModifier.current = false;
    const handler = (e: KeyboardEvent) => {
      hasModifier.current = e.altKey;
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [activeEditor]);

  useEffect(() => {
    // Build URL with proper parameter handling
    const searchName = searchParams.get('name') || '';
    const page = searchParams.get('page') || '1';
    const searchUrl = new URL(`/api/files/${params.courseId}/search`, window.location.origin);

    // Add search parameters
    searchUrl.searchParams.set('fileType', FileType.IMAGE);
    searchUrl.searchParams.set('page', page);
    if (searchName) {
      searchUrl.searchParams.set('name', searchName);
    }

    // Load the data
    fetcher.load(searchUrl.pathname + searchUrl.search);
    initialLoadRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.courseId, searchParams, fetcher.load]);

  // Show spinner during initial load or when there's no data yet
  const isInitialLoading = !initialLoadRef.current || (fetcher.state !== 'idle' && !fetcher.data);

  const getImageDimensions = (file: any): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };

      img.onerror = () => {
        // Fallback to default dimensions if image fails to load
        console.warn(`Failed to load dimensions for image: ${file.name}`);
        resolve({ width: 300, height: 200 });
      };

      // Use the signed_url from the file object
      img.src = file.signed_url;
    });
  };

  const handleImageInsert = async (file: SearchFileResult) => {
    try {
      const { width, height } = await getImageDimensions(file);

      const payload: InsertImagePayload = {
        fileId: file.id,
        blurHash: file.blur_preview ?? '',
        width,
        height,
      };

      activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
      onClose();
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      // Fallback to default dimensions
      const payload: InsertImagePayload = {
        fileId: file.id,
        blurHash: file.blur_preview ?? '',
        width: 300,
        height: 200,
      };

      activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
      onClose();
    }
  };

  return (
    <div className='pb-8'>
      <motion.div
        className='py-4'
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SearchInput placeholder='Search for images...' />
      </motion.div>
      {isInitialLoading ? (
        <Spinner />
      ) : fetcher.data?.data && fetcher.data.data.length > 0 ? (
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
              {fetcher.data.data.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <PlainButton
                    key={file.id}
                    onClick={() => handleImageInsert(file)}
                    className='h-full w-full'
                  >
                    <FileRenderer file={file} canEdit={false} />
                  </PlainButton>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      ) : (
        <div className='text-muted-foreground mt-4 text-center'>No images found</div>
      )}
    </div>
  );
}
