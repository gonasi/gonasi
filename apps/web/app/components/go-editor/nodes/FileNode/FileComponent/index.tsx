import React, { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';

import { fetchFileById } from '@gonasi/database/files';

import { FileComponentWrapper } from './FileComponentWrapper';

import FileNodeRenderer from '~/components/file-renderers/file-node-renderer';
import { Spinner } from '~/components/loaders';
import { createBrowserClient } from '~/lib/supabase/supabaseClient';
import type { FileLoaderItemType } from '~/routes/dashboard/file-library/all-files';
import { useStore } from '~/store';

interface FileComponentProps {
  fileId: string;
  nodeKey: string;
}

/**
 * FileComponent displays a file attachment with download and remove options
 */
const FileComponent: React.FC<FileComponentProps> = ({ fileId, nodeKey }) => {
  const { activeSession } = useStore();
  const [editor] = useLexicalComposerContext();

  const [fileMetadata, setFileMetadata] = useState<FileLoaderItemType | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Supabase client outside the fetch function
  const supabase = React.useMemo(
    () => (activeSession ? createBrowserClient(activeSession) : null),
    [activeSession],
  );

  // Fetch file metadata and URL
  const fetchFileDetails = useCallback(async () => {
    if (!supabase) {
      setError('No active session');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchFileById(supabase, fileId);

      if (!data) {
        setError('File not found');
        return;
      }

      setFileUrl(data.signed_url);
      setFileMetadata({ ...data });
    } catch (err) {
      console.error('File retrieval error:', err);
      setError('Failed to retrieve file details');
    } finally {
      setLoading(false);
    }
  }, [fileId, supabase]);

  // Fetch file details when component mounts or dependencies change
  useEffect(() => {
    fetchFileDetails();
  }, [fetchFileDetails]);

  const handleDownload = useCallback(() => {
    if (!fileUrl || !fileMetadata) return;

    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileMetadata.name;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download file');
    }
  }, [fileUrl, fileMetadata]);

  const handleRemove = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        node.remove();
      }
    });
  }, [editor, nodeKey]);

  // Display loading state
  if (loading) {
    return <Spinner />;
  }

  // Display file not found
  if (!fileMetadata) {
    return (
      <div className='rounded border border-yellow-200 bg-yellow-50 p-3 text-yellow-700'>
        <p>File not found or inaccessible.</p>
        <button
          onClick={handleRemove}
          className='mt-2 rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:outline-none'
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <FileComponentWrapper>
      <FileNodeRenderer file={fileMetadata} />
    </FileComponentWrapper>
  );
};

export default React.memo(FileComponent);
