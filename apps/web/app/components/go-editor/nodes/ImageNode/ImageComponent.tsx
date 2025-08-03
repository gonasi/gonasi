import type { JSX } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFetcher } from 'react-router';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import { blurhashToCssGradientString } from '@unpic/placeholder';
import { motion } from 'framer-motion';
import type { BaseSelection, LexicalCommand, LexicalEditor } from 'lexical';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGSTART_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';

import type { loader } from '../../../../routes/api/get-signed-url';
import { $isImageNode, type ImagePayload } from '.';

import { useStore } from '~/store';

export const RIGHT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent> = createCommand(
  'RIGHT_CLICK_IMAGE_COMMAND',
);

const imageCache = new Map<string, Promise<boolean> | boolean>();

function isSVG(src: string): boolean {
  return src.toLowerCase().endsWith('.svg');
}

function useSuspenseImage(src: string) {
  let cached = imageCache.get(src);
  if (typeof cached === 'boolean') {
    return cached;
  } else if (!cached) {
    cached = new Promise<boolean>((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(false);
      img.onerror = () => resolve(true);
    }).then((hasError) => {
      imageCache.set(src, hasError);
      return hasError;
    });
    imageCache.set(src, cached);
    throw cached;
  }
  throw cached;
}

function BrokenImage(): JSX.Element {
  return <h2>Broken Image</h2>;
}

function LazyImage({
  altText,
  className,
  imageRef,
  src,
  width,
  height,
  maxWidth,
  onError,
  onLoad,
}: {
  altText: string;
  className: string | null;
  height: 'inherit' | number;
  imageRef: { current: null | HTMLImageElement };
  maxWidth: number;
  src: string;
  width: 'inherit' | number;
  onError: () => void;
  onLoad: () => void;
}): JSX.Element {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const isSVGImage = isSVG(src);

  useEffect(() => {
    if (imageRef.current && isSVGImage) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setDimensions({
        height: naturalHeight,
        width: naturalWidth,
      });
    }
  }, [imageRef, isSVGImage]);

  const hasError = useSuspenseImage(src);

  useEffect(() => {
    if (hasError) {
      onError();
    }
  }, [hasError, onError]);

  if (hasError) return <BrokenImage />;

  const calculateDimensions = () => {
    if (!isSVGImage) {
      return { height, maxWidth, width };
    }

    const naturalWidth = dimensions?.width || 200;
    const naturalHeight = dimensions?.height || 200;

    let finalWidth = naturalWidth;
    let finalHeight = naturalHeight;

    if (finalWidth > maxWidth) {
      const scale = maxWidth / finalWidth;
      finalWidth = maxWidth;
      finalHeight = Math.round(finalHeight * scale);
    }

    const maxHeight = 500;
    if (finalHeight > maxHeight) {
      const scale = maxHeight / finalHeight;
      finalHeight = maxHeight;
      finalWidth = Math.round(finalWidth * scale);
    }

    return {
      height: finalHeight,
      maxWidth,
      width: finalWidth,
    };
  };

  const imageStyle = calculateDimensions();

  return (
    <img
      className={className || undefined}
      src={src}
      alt={altText}
      ref={imageRef}
      style={imageStyle}
      onError={onError}
      draggable='false'
      onLoad={(e) => {
        onLoad(); // Call the onLoad callback
        if (isSVGImage) {
          const img = e.currentTarget;
          setDimensions({
            height: img.naturalHeight,
            width: img.naturalWidth,
          });
        }
      }}
    />
  );
}

export default function ImageComponent({
  fileId,
  width = 500,
  height = 500,
  maxWidth = 800,
  blurHash,
  cropRegion,
  key,
}: ImagePayload): JSX.Element {
  const fetcher = useFetcher<typeof loader>();

  const imageRef = useRef<null | HTMLImageElement>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(key ?? '');
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [selection, setSelection] = useState<BaseSelection | null>(null);
  const activeEditorRef = useRef<LexicalEditor | null>(null);
  const isEditable = useLexicalEditable();
  const [showCropper, setShowCropper] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { mode } = useStore();

  // Fixed: Added nodeKey which was missing
  const nodeKey = key ?? '';

  useEffect(() => {
    if (fileId) {
      fetcher.load(`/api/files/${fileId}/signed-url?mode=${mode}`);
    }
  }, [fileId, fetcher, mode]);

  const src = fetcher.data?.file?.signed_url;
  const backgroundBlur = blurHash || fetcher.data?.file?.blur_preview || undefined;
  const placeholder = backgroundBlur ? blurhashToCssGradientString(backgroundBlur) : '#f3f4f6';

  const $onEnter = useCallback(
    (event: KeyboardEvent) => {
      const latestSelection = $getSelection();
      if (
        isSelected &&
        $isNodeSelection(latestSelection) &&
        latestSelection.getNodes().length === 1
      ) {
        $setSelection(null);
        event.preventDefault();
        setShowCropper(true);
        return true;
      }
      return false;
    },
    [isSelected],
  );

  const $onEscape = useCallback((event: KeyboardEvent) => {
    if (buttonRef.current === event.target) {
      $setSelection(null);
      setShowCropper(false);
      return true;
    }
    return false;
  }, []);

  const onClick = useCallback(
    (payload: MouseEvent) => {
      if (isResizing) return true;
      if (payload.target === imageRef.current) {
        if (payload.shiftKey) {
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
    (event: MouseEvent) => {
      editor.getEditorState().read(() => {
        const latestSelection = $getSelection();
        const domElement = event.target as HTMLElement;
        if (
          domElement.tagName === 'IMG' &&
          $isRangeSelection(latestSelection) &&
          latestSelection.getNodes().length === 1
        ) {
          editor.dispatchCommand(RIGHT_CLICK_IMAGE_COMMAND, event);
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
        setSelection($isNodeSelection(updatedSelection) ? updatedSelection : null);
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor;
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW),
      editor.registerCommand(RIGHT_CLICK_IMAGE_COMMAND, onClick, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageRef.current) {
            event.preventDefault();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_ENTER_COMMAND, $onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ESCAPE_COMMAND, $onEscape, COMMAND_PRIORITY_LOW),
    );
    rootElement?.addEventListener('contextmenu', onRightClick);
    return () => {
      unregister();
      rootElement?.removeEventListener('contextmenu', onRightClick);
    };
  }, [
    clearSelection,
    editor,
    isResizing,
    isSelected,
    $onEnter,
    $onEscape,
    onClick,
    onRightClick,
    setSelected,
  ]);

  const onResizeEnd = (nextWidth: 'inherit' | number, nextHeight: 'inherit' | number) => {
    setTimeout(() => setIsResizing(false), 200);
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setWidthAndHeight(nextWidth, nextHeight);
      }
    });
  };

  const onResizeStart = () => setIsResizing(true);

  const draggable = isSelected && $isNodeSelection(selection) && !isResizing;
  const isFocused = (isSelected || isResizing) && isEditable;

  return (
    <>
      <div
        draggable={draggable}
        className='relative overflow-hidden'
        style={{
          maxWidth: '100%',
          width,
          height,
        }}
      >
        {/* Blurred placeholder layer (behind) */}
        <div
          className='absolute inset-0'
          style={{
            background: placeholder,
          }}
        />

        {/* Real image layer (on top, animated in) */}
        {src && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }} // Fixed: Added animate prop
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className='absolute inset-0'
          >
            <LazyImage
              altText='Rich Text Image'
              className='h-full w-full object-cover'
              height={height}
              imageRef={imageRef}
              maxWidth={maxWidth}
              src={src}
              width={width}
              onLoad={() => setIsLoaded(true)}
              onError={() => {}}
            />
          </motion.div>
        )}
      </div>

      {$isNodeSelection(selection) && isFocused && <h2>resize</h2>}
    </>
  );
}
