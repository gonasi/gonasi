import { useCallback, useEffect, useRef, useState } from 'react';
import { useFetcher } from 'react-router';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import { Box } from 'lucide-react';
import type { BaseSelection } from 'lexical';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';

import { $isModel3DNode } from '.';
import ImageResizer from '../ImageNode/ImageResizer';

import { ModelPreviewCard } from '~/components/file-renderers/preview-cards/model-preview-card';
import type { loader } from '~/routes/api/get-signed-url';
import { useStore } from '~/store';

interface Model3DComponentProps {
  fileId: string;
  width: 'inherit' | number;
  height: 'inherit' | number;
  maxWidth: number;
  nodeKey: string;
}

export default function Model3DComponent({
  fileId,
  width,
  height,
  maxWidth,
  nodeKey,
}: Model3DComponentProps) {
  const fetcher = useFetcher<typeof loader>();
  const containerRef = useRef<null | HTMLDivElement>(null);

  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const { mode } = useStore();

  const [selection, setSelection] = useState<BaseSelection | null>(null);
  const [isLoadError, setIsLoadError] = useState<boolean>(false);

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const onResizeEnd = (nextWidth: 'inherit' | number, nextHeight: 'inherit' | number) => {
    setTimeout(() => {
      setIsResizing(false);
    }, 200);

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isModel3DNode(node)) {
        node.setWidthAndHeight(nextWidth, nextHeight);
      }
    });
  };

  useEffect(() => {
    if (fileId) {
      fetcher.load(`/api/files/${fileId}/signed-url?mode=${mode}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, mode]);

  const fileData = fetcher.data?.success ? fetcher.data.data : undefined;

  const hasFetcherError = Boolean(
    fetcher.state === 'idle' && fetcher.data && fetcher.data.success === false,
  );
  const hasError = Boolean(isLoadError || hasFetcherError);

  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload;

      if (
        event.target === containerRef.current ||
        containerRef.current?.contains(event.target as Node)
      ) {
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

  const isFocused = (isSelected || isResizing) && isEditable;

  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : '100%',
    height: typeof height === 'number' ? `${height}px` : '400px',
  };

  if (hasError) {
    return (
      <div className='border-destructive bg-destructive/10 my-2 flex items-center gap-2 rounded-md border p-4'>
        <Box className='text-destructive' size={20} />
        <span className='text-destructive text-sm'>Failed to load 3D model</span>
      </div>
    );
  }

  if (!fileData) {
    return (
      <div className='bg-muted my-2 flex items-center gap-2 rounded-md p-4'>
        <Box className='text-muted-foreground animate-pulse' size={20} />
        <span className='text-muted-foreground text-sm'>Loading 3D model...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className='relative my-2 inline-block'
      style={{ maxWidth: `${maxWidth}px`, ...containerStyle }}
    >
      <div
        className={`overflow-hidden rounded-md ${
          isFocused ? 'ring-secondary ring-2 ring-offset-2' : ''
        }`}
        style={{ width: '100%', height: '100%' }}
      >
        <ModelPreviewCard file={fileData as any} />
      </div>
      {$isNodeSelection(selection) && isFocused && (
        <ImageResizer
          editor={editor}
          imageRef={containerRef}
          maxWidth={maxWidth}
          onResizeStart={onResizeStart}
          onResizeEnd={onResizeEnd}
        />
      )}
    </div>
  );
}
