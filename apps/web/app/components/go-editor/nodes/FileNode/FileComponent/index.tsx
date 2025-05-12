import React, { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';
import { CircleOff } from 'lucide-react';

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
      <div className='bg-warning text-warning-foreground flex items-center space-x-4 rounded-lg p-4'>
        <CircleOff />
        <p>File not found or inaccessible.</p>
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
