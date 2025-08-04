import type { JSX } from 'react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useFetcher } from 'react-router';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import { blurhashToCssGradientString } from '@unpic/placeholder';
import type { BaseSelection, LexicalCommand, LexicalEditor } from 'lexical';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGSTART_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';

import { calculateDimensions } from './utils/calculateDimensions';
import type { ImagePayload } from '.';
import ImageResizer from './ImageResizer';
import { $isImageNode } from '.';

import type { loader } from '~/routes/api/get-signed-url';
import { useStore } from '~/store';

export const RIGHT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent> = createCommand(
  'RIGHT_CLICK_IMAGE_COMMAND',
);

function LazyImage({
  altText,
  className,
  imageRef,
  src,
  isSVGImage,
  width,
  height,
  maxWidth,
  onError,
  placeholder,
  isLoaded,
  onLoad,
  hasError,
}: {
  altText: string;
  className: string | null;
  height: 'inherit' | number;
  imageRef: { current: null | HTMLImageElement };
  maxWidth: number;
  src: string;
  isSVGImage: boolean;
  width: 'inherit' | number;
  onError: () => void;
  placeholder: string;
  isLoaded: boolean;
  onLoad: () => void;
  hasError: boolean;
}): JSX.Element {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Set initial dimensions for SVG images
  useEffect(() => {
    if (imageRef.current && isSVGImage) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setDimensions({
        height: naturalHeight,
        width: naturalWidth,
      });
    }
  }, [imageRef, isSVGImage]);

  const imageStyle = calculateDimensions({
    width,
    height,
    dimensions,
    maxWidth,
  });

  return (
    <>
      {!src && !hasError && (
        <div
          className={className || undefined}
          style={{
            background: placeholder,
            opacity: isLoaded ? 0 : 1,
            ...imageStyle,
          }}
        />
      )}
      {src && !hasError && (
        <img
          className={className || undefined}
          src={src}
          alt={altText}
          ref={imageRef}
          style={imageStyle}
          onError={onError}
          draggable='false'
          onLoad={(e) => {
            if (isSVGImage) {
              const img = e.currentTarget;
              setDimensions({
                height: img.naturalHeight,
                width: img.naturalWidth,
              });
            }
            onLoad();
          }}
        />
      )}
    </>
  );
}

interface ImageComponentProps extends ImagePayload {
  nodeKey: string;
}

export default function ImageComponent({
  fileId,
  blurHash,
  nodeKey,
  width,
  height,
  maxWidth = 800,
}: ImageComponentProps) {
  const fetcher = useFetcher<typeof loader>();
  const [isLoaded, setIsLoaded] = useState(false);
  const imageRef = useRef<null | HTMLImageElement>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [editor] = useLexicalComposerContext();

  const { mode } = useStore();

  useEffect(() => {
    if (fileId) {
      fetcher.load(`/api/files/${fileId}/signed-url?mode=${mode}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, mode]);

  const src = fetcher.data?.success ? fetcher.data.data?.signed_url : undefined;

  const placeholder = blurHash ? blurhashToCssGradientString(blurHash) : '#f3f4f6';
  const isSVGImage = fetcher.data?.success ? fetcher.data.data?.extension === 'svg' : false;

  const [selection, setSelection] = useState<BaseSelection | null>(null);
  const activeEditorRef = useRef<LexicalEditor | null>(null);

  const [isLoadError, setIsLoadError] = useState<boolean>(false);
  const isEditable = useLexicalEditable();

  // Fixed: Only consider it a fetcher error if the fetcher has completed and the API returned success: false
  const hasFetcherError = Boolean(
    fetcher.state === 'idle' && fetcher.data && fetcher.data.success === false, // Check the success field from the new API shape
  );
  const hasError = Boolean(isLoadError || hasFetcherError);

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload;

      if (isResizing) {
        return true;
      }
      if (event.target === imageRef.current) {
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
    [isResizing, isSelected, setSelected, clearSelection],
  );

  const onRightClick = useCallback(
    (event: MouseEvent): void => {
      editor.getEditorState().read(() => {
        const latestSelection = $getSelection();
        const domElement = event.target as HTMLElement;
        if (
          domElement.tagName === 'IMG' &&
          $isRangeSelection(latestSelection) &&
          latestSelection.getNodes().length === 1
        ) {
          editor.dispatchCommand(RIGHT_CLICK_IMAGE_COMMAND, event as MouseEvent);
        }
      });
    },
    [editor],
  );

  useEffect(() => {
    const rootElement = editor.getRootElement();
    const unregister = mergeRegister(
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
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor;
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<MouseEvent>(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW),
      editor.registerCommand<MouseEvent>(RIGHT_CLICK_IMAGE_COMMAND, onClick, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageRef.current) {
            // TODO This is just a temporary workaround for FF to behave like other browsers.
            // Ideally, this handles drag & drop too (and all browsers).
            event.preventDefault();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );

    rootElement?.addEventListener('contextmenu', onRightClick);

    return () => {
      unregister();
      rootElement?.removeEventListener('contextmenu', onRightClick);
    };
  }, [clearSelection, editor, isResizing, isSelected, onClick, onRightClick, setSelected]);

  const onResizeEnd = (nextWidth: 'inherit' | number, nextHeight: 'inherit' | number) => {
    // Delay hiding the resize bars for click case
    setTimeout(() => {
      setIsResizing(false);
    }, 200);

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setWidthAndHeight(nextWidth, nextHeight);
      }
    });
  };

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const draggable = isSelected && $isNodeSelection(selection) && !isResizing;
  const isFocused = (isSelected || isResizing) && isEditable;

  return (
    <Suspense fallback={null}>
      <>
        <div draggable={draggable}>
          <LazyImage
            className={
              isFocused
                ? `${$isNodeSelection(selection) ? 'cursor-grab active:cursor-grabbing' : ''} ring-secondary ring-2 ring-offset-2`
                : ''
            }
            src={src ?? ''}
            altText='Rich Text Image'
            imageRef={imageRef}
            width={width}
            height={height}
            maxWidth={maxWidth}
            onError={() => setIsLoadError(true)}
            placeholder={placeholder}
            isLoaded={isLoaded && !!src}
            onLoad={handleImageLoad}
            isSVGImage={isSVGImage}
            hasError={hasError}
          />
        </div>

        {$isNodeSelection(selection) && isFocused && (
          <ImageResizer
            editor={editor}
            imageRef={imageRef}
            onResizeEnd={onResizeEnd}
            onResizeStart={onResizeStart}
          />
        )}
      </>
    </Suspense>
  );
}
