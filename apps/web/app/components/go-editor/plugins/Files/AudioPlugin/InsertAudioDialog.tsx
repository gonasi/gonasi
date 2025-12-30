import { type JSX, useEffect, useRef } from 'react';
import { useFetcher, useParams, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import type { LexicalEditor } from 'lexical';

import { FileType } from '@gonasi/schemas/file';

import { INSERT_AUDIO_COMMAND, type InsertAudioPayload } from '.';

import FileRenderer from '~/components/file-renderers/file-renderer';
import { Spinner } from '~/components/loaders';
import { SearchInput } from '~/components/search-params/search-input';
import { PlainButton } from '~/components/ui/button';
import type { loader, SearchFileResult } from '~/routes/api/search-files';

export default function InsertAudioDialog({
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

  useEffect(() => {
    const searchName = searchParams.get('name') || '';
    const page = searchParams.get('page') || '1';
    const searchUrl = new URL(`/api/files/${params.courseId}/search`, window.location.origin);

    searchUrl.searchParams.set('fileType', FileType.AUDIO);
    searchUrl.searchParams.set('page', page);
    if (searchName) {
      searchUrl.searchParams.set('name', searchName);
    }

    fetcher.load(searchUrl.pathname + searchUrl.search);
    initialLoadRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.courseId, searchParams, fetcher.load]);

  const isInitialLoading = !initialLoadRef.current || (fetcher.state !== 'idle' && !fetcher.data);

  const handleAudioInsert = (file: SearchFileResult) => {
    const payload: InsertAudioPayload = {
      fileId: file.id,
    };

    activeEditor.dispatchCommand(INSERT_AUDIO_COMMAND, payload);
    onClose();
  };

  return (
    <div className='pb-8'>
      <motion.div
        className='py-4'
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SearchInput placeholder='Search for audio files...' />
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
                    onClick={() => handleAudioInsert(file)}
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
        <div className='text-muted-foreground mt-4 text-center'>
          This course doesn't have audio files yet. Add some to enhance your content.
        </div>
      )}
    </div>
  );
}
