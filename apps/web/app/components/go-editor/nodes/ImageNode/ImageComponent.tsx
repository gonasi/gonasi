import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFetcher } from 'react-router';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import { blurhashToCssGradientString } from '@unpic/placeholder';
import { Image } from '@unpic/react';
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

// Constants
export const RIGHT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent> = createCommand(
  'RIGHT_CLICK_IMAGE_COMMAND',
);

const DEFAULT_FALLBACK_COLOR = '#f3f4f6';
const MAX_SVG_HEIGHT = 500;
const RESIZE_TIMEOUT = 200;
const ANIMATION_DURATION = 0.6;

// Types
interface ImageDimensions {
  width: number;
  height: number;
}

interface CalculatedDimensions {
  width: number | 'inherit';
  height: number | 'inherit';
  maxWidth: number;
}

// Image cache for better performance
const imageCache = new Map<string, Promise<boolean> | boolean>();

// Utility functions
const isSVG = (src: string): boolean => src.toLowerCase().endsWith('.svg');

const useSuspenseImage = (src: string): boolean => {
  const cached = imageCache.get(src);

  if (typeof cached === 'boolean') {
    return cached;
  }

  if (!cached) {
    const promise = new Promise<boolean>((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(false);
      img.onerror = () => resolve(true);
    }).then((hasError) => {
      imageCache.set(src, hasError);
      return hasError;
    });

    imageCache.set(src, promise);
    throw promise;
  }

  throw cached;
};

// Component for broken image state
const BrokenImage = (): JSX.Element => (
  <div className='flex h-full w-full items-center justify-center bg-gray-100 text-gray-500'>
    <span>Image failed to load</span>
  </div>
);

// Props interface for LazyImage
interface LazyImageProps {
  altText: string;
  className: string | null;
  height: 'inherit' | number;
  imageRef: React.RefObject<HTMLImageElement>;
  maxWidth: number;
  src: string;
  width: 'inherit' | number;
  onError: () => void;
  onLoad: () => void;
}

// Optimized LazyImage component
const LazyImage = ({
  altText,
  className,
  src,
  width,
  height,
  maxWidth,
  imageRef,
  onError,
  onLoad,
}: LazyImageProps): JSX.Element => {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const isSVGImage = useMemo(() => isSVG(src), [src]);

  const hasError = useSuspenseImage(src);

  useEffect(() => {
    if (hasError) {
      onError();
    }
  }, [hasError, onError]);

  const calculateDimensions = useCallback((): CalculatedDimensions => {
    if (!isSVGImage) {
      return { height, maxWidth, width };
    }

    const naturalWidth = dimensions?.width || 200;
    const naturalHeight = dimensions?.height || 200;

    let finalWidth = naturalWidth;
    let finalHeight = naturalHeight;

    // Scale down if width exceeds maxWidth
    if (finalWidth > maxWidth) {
      const scale = maxWidth / finalWidth;
      finalWidth = maxWidth;
      finalHeight = Math.round(finalHeight * scale);
    }

    // Scale down if height exceeds maximum
    if (finalHeight > MAX_SVG_HEIGHT) {
      const scale = MAX_SVG_HEIGHT / finalHeight;
      finalHeight = MAX_SVG_HEIGHT;
      finalWidth = Math.round(finalWidth * scale);
    }

    return {
      height: finalHeight,
      maxWidth,
      width: finalWidth,
    };
  }, [isSVGImage, dimensions, height, maxWidth, width]);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      onLoad();

      if (isSVGImage) {
        const img = e.currentTarget;
        setDimensions({
          height: img.naturalHeight,
          width: img.naturalWidth,
        });
      }
    },
    [isSVGImage, onLoad],
  );

  if (hasError) {
    return <BrokenImage />;
  }

  const imageStyle = calculateDimensions();

  return (
    <img
      className={className || undefined}
      src={src}
      alt={altText}
      ref={imageRef}
      style={imageStyle}
      onError={onError}
      onLoad={handleLoad}
      draggable={false}
    />
  );
};

// Main ImageComponent
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
  const imageRef = useRef<HTMLImageElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const activeEditorRef = useRef<LexicalEditor | null>(null);

  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(key ?? '');
  const [isResizing, setIsResizing] = useState(false);
  const [selection, setSelection] = useState<BaseSelection | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const { mode } = useStore();

  const nodeKey = key ?? '';

  // Fetch signed URL when fileId changes
  useEffect(() => {
    if (fileId) {
      fetcher.load(`/api/files/${fileId}/signed-url?mode=${mode}`);
    }
  }, [fileId, fetcher, mode]);

  // Memoized values
  const src = fetcher.data?.file?.signed_url;
  const backgroundBlur = blurHash || fetcher.data?.file?.blur_preview;
  const placeholder = useMemo(
    () => (backgroundBlur ? blurhashToCssGradientString(backgroundBlur) : DEFAULT_FALLBACK_COLOR),
    [backgroundBlur],
  );

  // Event handlers
  const handleEnter = useCallback(
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

  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (buttonRef.current === event.target) {
      $setSelection(null);
      setShowCropper(false);
      return true;
    }
    return false;
  }, []);

  const handleClick = useCallback(
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

  const handleRightClick = useCallback(
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

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleResizeEnd = useCallback(
    (nextWidth: 'inherit' | number, nextHeight: 'inherit' | number) => {
      setTimeout(() => setIsResizing(false), RESIZE_TIMEOUT);

      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.setWidthAndHeight(nextWidth, nextHeight);
        }
      });
    },
    [editor, nodeKey],
  );

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    // Handle error if needed
  }, []);

  // Register editor commands and listeners
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
      editor.registerCommand(CLICK_COMMAND, handleClick, COMMAND_PRIORITY_LOW),
      editor.registerCommand(RIGHT_CLICK_IMAGE_COMMAND, handleClick, COMMAND_PRIORITY_LOW),
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
      editor.registerCommand(KEY_ENTER_COMMAND, handleEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ESCAPE_COMMAND, handleEscape, COMMAND_PRIORITY_LOW),
    );

    const handleContextMenu = (event: Event) => handleRightClick(event as MouseEvent);
    rootElement?.addEventListener('contextmenu', handleContextMenu);

    return () => {
      unregister();
      rootElement?.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [editor, handleClick, handleEnter, handleEscape, handleRightClick]);

  // Computed values for rendering
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
        {/* Placeholder background */}
        <div className='absolute inset-0' style={{ background: placeholder }} />

        {/* Main image with fade-in animation */}
        {src && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: ANIMATION_DURATION, ease: 'easeOut' }}
            className='absolute inset-0'
          >
            <Image
              src={src}
              layout='fixed'
              width={width}
              height={height}
              alt='Rich Text Image'
              onLoad={handleImageLoad}
              className='h-full w-full object-cover'
            />
          </motion.div>
        )}
      </div>

      {/* Resize controls */}
      {$isNodeSelection(selection) && isFocused && (
        <div className='mt-2 text-sm text-gray-500'>Resize controls active</div>
      )}
    </>
  );
}
