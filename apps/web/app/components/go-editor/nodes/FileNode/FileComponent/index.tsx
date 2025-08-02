import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { CLICK_COMMAND, COMMAND_PRIORITY_LOW } from 'lexical';
import { CircleOff } from 'lucide-react';
import { toast } from 'sonner';

import { fetchFileById, type FetchFileByIdReturn } from '@gonasi/database/files';

import { FileComponentWrapper } from './FileComponentWrapper';

import FileNodeRenderer from '~/components/file-renderers/file-node-renderer';
import { Spinner } from '~/components/loaders';
import { createBrowserClient } from '~/lib/supabase/supabaseClient';
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

  const [fileMetadata, setFileMetadata] = useState<FetchFileByIdReturn>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

  // Initialize Supabase client outside the fetch function
  const supabase = useMemo(
    () => (activeSession ? createBrowserClient(activeSession) : null),
    [activeSession],
  );

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Fetch file metadata and URL
  const fetchFileDetails = useCallback(async () => {
    if (!supabase) {
      setError('No active session');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchFileById({ supabase, fileId });

      if (!data) {
        setError('File not found');
        return;
      }

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

  // Register click command for selection
  useEffect(() => {
    return editor.registerCommand(
      CLICK_COMMAND,
      (event) => {
        const eventTarget = event.target as HTMLElement;
        if (eventTarget.closest(`[data-node-key="${nodeKey}"]`)) {
          if (event.shiftKey) {
            setSelected(!isSelected);
          } else {
            clearSelection();
            setSelected(true);
          }
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, nodeKey, isSelected, setSelected, clearSelection]);

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
    <FileComponentWrapper
      data-node-key={nodeKey}
      className={isSelected ? 'border border-red-500' : ''}
    >
      <FileNodeRenderer file={fileMetadata} />
    </FileComponentWrapper>
  );
};

export default React.memo(FileComponent);
