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
    <div className='relative overflow-hidden' style={imageStyle}>
      {/* Blurred placeholder layer (behind) */}
      <div
        className='absolute inset-0 transition-opacity duration-600 ease-out'
        style={{
          background: placeholder,
          opacity: isLoaded ? 0 : 1,
        }}
      />

      {/* Error state */}
      {hasError && (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500'>
          <div className='text-center'>
            <div className='mb-2 text-2xl'>📷</div>
            <div className='text-sm'>Image not found</div>
          </div>
        </div>
      )}

      {/* Real image layer (on top) */}
      {src && !hasError && (
        <img
          className={`${className || ''} absolute inset-0 h-full w-full object-cover transition-opacity duration-600 ease-out`}
          src={src}
          alt={altText}
          ref={imageRef}
          style={{
            opacity: isLoaded ? 1 : 0,
          }}
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
    </div>
  );
}

export default function ImageComponent({
  fileId,
  blurHash,
  key,
  width,
  height,
  maxWidth = 800,
}: ImagePayload) {
  const fetcher = useFetcher<typeof loader>();
  const [isLoaded, setIsLoaded] = useState(false);
  const imageRef = useRef<null | HTMLImageElement>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(key ?? '');
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [editor] = useLexicalComposerContext();

  const { mode } = useStore();

  useEffect(() => {
    if (fileId) {
      fetcher.load(`/api/files/${fileId}/signed-url?mode=${mode}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, mode]);

  const src = fetcher.data?.file?.signed_url;
  const backgroundBlur = blurHash || fetcher.data?.file?.blur_preview || undefined;
  const placeholder = backgroundBlur ? blurhashToCssGradientString(backgroundBlur) : '#f3f4f6';
  const isSVGImage = fetcher.data?.file?.extension === 'svg';

  const [selection, setSelection] = useState<BaseSelection | null>(null);
  const activeEditorRef = useRef<LexicalEditor | null>(null);

  const [isLoadError, setIsLoadError] = useState<boolean>(false);
  const isEditable = useLexicalEditable();

  // Check for fetcher errors (file not found, etc.)
  const hasFetcherError = Boolean(
    fetcher.state === 'idle' && fileId && (!fetcher.data || !fetcher.data.file),
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
      const node = $getNodeByKey(key ?? '');
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
              isFocused ? `focused ${$isNodeSelection(selection) ? 'draggable' : ''}` : null
            }
            src={src}
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

        {$isNodeSelection(selection) && isFocused && <h2>Resize Component Soon</h2>}
      </>
    </Suspense>
  );
}
