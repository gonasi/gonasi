import { useCallback, useEffect, useRef, useState } from 'react';
import { useFetcher } from 'react-router';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import { Volume2 } from 'lucide-react';
import type { BaseSelection } from 'lexical';
import {
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';

import type { loader } from '~/routes/api/get-signed-url';
import { useStore } from '~/store';

interface AudioComponentProps {
  fileId: string;
  nodeKey: string;
}

export default function AudioComponent({ fileId, nodeKey }: AudioComponentProps) {
  const fetcher = useFetcher<typeof loader>();
  const audioRef = useRef<null | HTMLAudioElement>(null);

  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [editor] = useLexicalComposerContext();
  const { mode } = useStore();

  const [selection, setSelection] = useState<BaseSelection | null>(null);
  const [isLoadError, setIsLoadError] = useState<boolean>(false);

  useEffect(() => {
    if (fileId) {
      fetcher.load(`/api/files/${fileId}/signed-url?mode=${mode}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, mode]);

  const src = fetcher.data?.success ? fetcher.data.data?.signed_url : undefined;
  const fileName = fetcher.data?.success ? fetcher.data.data?.name : undefined;

  const hasFetcherError = Boolean(
    fetcher.state === 'idle' && fetcher.data && fetcher.data.success === false,
  );
  const hasError = Boolean(isLoadError || hasFetcherError);

  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload;

      if (event.target === audioRef.current || audioRef.current?.contains(event.target as Node)) {
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
    [isSelected, setSelected, clearSelection],
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        const updatedSelection = editorState.read(() => $getSelection());
        if ($isNodeSelection(updatedSelection)) {
          setSelection(updatedSelection);
        } else {
          setSelection(null);
        }
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<MouseEvent>(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW),
    );
  }, [clearSelection, editor, isSelected, onClick, setSelected]);

  const isFocused = isSelected;

  if (hasError) {
    return (
      <div className='border-destructive bg-destructive/10 my-2 flex items-center gap-2 rounded-md border p-4'>
        <Volume2 className='text-destructive' size={20} />
        <span className='text-destructive text-sm'>Failed to load audio file</span>
      </div>
    );
  }

  if (!src) {
    return (
      <div className='bg-muted my-2 flex items-center gap-2 rounded-md p-4'>
        <Volume2 className='text-muted-foreground animate-pulse' size={20} />
        <span className='text-muted-foreground text-sm'>Loading audio...</span>
      </div>
    );
  }

  return (
    <div
      className={`my-2 inline-block w-full max-w-2xl ${
        isFocused ? 'ring-secondary ring-2 ring-offset-2' : ''
      }`}
    >
      <div className='bg-card border-border flex flex-col gap-2 rounded-md border p-4'>
        <div className='flex items-center gap-2'>
          <Volume2 size={20} className='text-primary' />
          {fileName && <span className='text-foreground text-sm font-medium'>{fileName}</span>}
        </div>
        <audio
          ref={audioRef}
          src={src}
          controls
          className='w-full'
          onError={() => setIsLoadError(true)}
          preload='metadata'
        />
      </div>
    </div>
  );
}
