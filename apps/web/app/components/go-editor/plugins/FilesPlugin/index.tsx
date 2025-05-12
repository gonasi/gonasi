import React, { useEffect, useState } from 'react';
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

import { fetchFilesWithSignedUrls } from '@gonasi/database/files';

import type { FilePayload } from '../../nodes/FileNode';
import { $createFileNode, FileNode } from '../../nodes/FileNode';

import FileRenderer from '~/components/file-renderers/file-renderer';
import { Spinner } from '~/components/loaders';
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
} // Update with actual path

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
  const [fileId, setFileId] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination params with defaults
  const [limit] = useState(10);
  const [page] = useState(1);

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
          searchQuery,
          limit,
          page,
        });

        setFiles(fetchedFiles);
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, params.companyId, searchQuery, limit, page]);

  return (
    <div>
      {loading ? (
        <Spinner />
      ) : (
        <>
          {/* <SearchInput /> */}
          {files.data.length > 0 && (
            <div className='mb-4'>
              <h3 className='mb-2 text-lg font-medium'>Available Files</h3>

              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                {files.data.map((file) => (
                  <button key={file.id} onClick={() => handleFileInsert({ fileId: file.id })}>
                    <FileRenderer file={file} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
