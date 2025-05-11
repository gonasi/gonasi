import type { JSX } from 'react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import clsx from 'clsx';
import type { BaseSelection, LexicalCommand, NodeKey } from 'lexical';
import {
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGSTART_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
} from 'lexical';
import { Box, File as FileIcon, FileAudio, FileImage, FileText, FileVideo } from 'lucide-react';

import { FileType } from '@gonasi/schemas/file';

import { FileRenderer } from './FileRenderer';
import { $isFileNode } from '.';

import { Spinner } from '~/components/loaders';

const fileCache = new Set();

export const RIGHT_CLICK_FILE_COMMAND: LexicalCommand<MouseEvent> = createCommand(
  'RIGHT_CLICK_FILE_COMMAND',
);

function useSuspenseFile(src: string) {
  if (!fileCache.has(src)) {
    throw new Promise((resolve) => {
      if (src.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff?)$/i.test(src)) {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          fileCache.add(src);
          resolve(null);
        };
        img.onerror = () => {
          fileCache.add(src);
          resolve(null);
        };
      } else {
        fileCache.add(src);
        resolve(null);
      }
    });
  }
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
}: {
  altText: string;
  className: string | null;
  height: 'inherit' | number;
  imageRef: { current: null | HTMLImageElement };
  maxWidth: number;
  src: string;
  width: 'inherit' | number;
  onError: () => void;
}): JSX.Element {
  useSuspenseFile(src);
  return (
    <img
      className={className || undefined}
      src={src}
      alt={altText}
      ref={imageRef}
      style={{ height, maxWidth, width }}
      onError={onError}
      draggable='false'
    />
  );
}

function BrokenFile({ fileType }: { fileType: FileType }): JSX.Element {
  let Icon = FileIcon;
  switch (fileType) {
    case FileType.IMAGE:
      Icon = FileImage;
      break;
    case FileType.AUDIO:
      Icon = FileAudio;
      break;
    case FileType.VIDEO:
      Icon = FileVideo;
      break;
    case FileType.MODEL_3D:
      Icon = Box;
      break;
    case FileType.DOCUMENT:
      Icon = FileText;
      break;
    default:
      Icon = FileIcon;
  }

  return (
    <div className='flex flex-col items-center justify-center p-4 opacity-70'>
      <Icon size={48} />
      <p className='mt-2 text-sm'>File unavailable</p>
    </div>
  );
}

function AudioPlayer({
  src,
  altText,
  className,
}: {
  src: string;
  altText: string;
  className: string | null;
}): JSX.Element {
  return (
    <audio controls className={className || 'w-full'} src={src} title={altText}>
      Your browser does not support the audio element.
    </audio>
  );
}

function VideoPlayer({
  src,
  altText,
  className,
}: {
  src: string;
  altText: string;
  className: string | null;
}): JSX.Element {
  return (
    <video controls className={className || 'w-full'} src={src} title={altText}>
      Your browser does not support the video element.
    </video>
  );
}

export default function FileComponent({
  src,
  altText,
  nodeKey,
  width,
  height,
  maxWidth,
  fileType,
  fileName,
  resizable,
}: {
  altText: string;
  height: 'inherit' | number;
  maxWidth: number;
  nodeKey: NodeKey;
  src: string;
  width: 'inherit' | number;
  fileType: FileType;
  fileName: string;
  resizable?: boolean;
}): JSX.Element {
  const fileRef = useRef<HTMLElement | null>(null);
  const imageRef = useRef<null | HTMLImageElement>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState(false);
  const [editor] = useLexicalComposerContext();
  const [selection, setSelection] = useState<BaseSelection | null>(null);
  const [isLoadError, setIsLoadError] = useState(false);
  const isEditable = useLexicalEditable();

  const $onDelete = useCallback(() => {
    if (isSelected) {
      const deleteSelection = $getSelection();
      if ($isNodeSelection(deleteSelection)) {
        deleteSelection.getNodes().forEach((node) => {
          if ($isFileNode(node)) {
            node.remove();
          }
        });
      }
      return true;
    }
    return false;
  }, [isSelected]);

  const $onEnter = useCallback(() => {
    // Prevent Enter from doing anything while selected
    return isSelected;
  }, [isSelected]);

  const $onEscape = useCallback(() => {
    if (isSelected) {
      $setSelection(null);
      return true;
    }
    return false;
  }, [isSelected]);

  const onClick = useCallback(
    (event: MouseEvent) => {
      if (isResizing) {
        return true;
      }

      // Check if the click is directly on the file component content
      const isContentTarget =
        fileRef.current?.contains(event.target as Node) || imageRef.current === event.target;

      if (!isContentTarget) {
        return false;
      }

      if (event.shiftKey) {
        setSelected(!isSelected);
      } else {
        clearSelection();
        setSelected(true);
      }
      return true;
    },
    [isResizing, isSelected, setSelected, clearSelection],
  );

  const onRightClick = useCallback(
    (event: MouseEvent) => {
      editor.getEditorState().read(() => {
        const latestSelection = $getSelection();
        if ($isRangeSelection(latestSelection) && latestSelection.getNodes().length === 1) {
          editor.dispatchCommand(RIGHT_CLICK_FILE_COMMAND, event);
        }
      });
    },
    [editor],
  );

  useEffect(() => {
    const rootElement = editor.getRootElement();
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const currentSelection = $getSelection();
          setSelection(currentSelection);
        });
      }),
      editor.registerCommand<MouseEvent>(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW),
      editor.registerCommand<MouseEvent>(RIGHT_CLICK_FILE_COMMAND, onClick, COMMAND_PRIORITY_LOW),
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
      editor.registerCommand(KEY_DELETE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ENTER_COMMAND, $onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ESCAPE_COMMAND, $onEscape, COMMAND_PRIORITY_LOW),
    );

    rootElement?.addEventListener('contextmenu', onRightClick);

    return () => {
      unregister();
      rootElement?.removeEventListener('contextmenu', onRightClick);
    };
  }, [
    editor,
    isResizing,
    isSelected,
    nodeKey,
    $onDelete,
    $onEnter,
    $onEscape,
    onClick,
    onRightClick,
    setSelected,
    clearSelection,
  ]);

  const draggable = isSelected && $isNodeSelection(selection) && !isResizing;
  const isFocused = (isSelected || isResizing) && isEditable;

  const baseClassName = clsx(
    isFocused && 'ring-primary p-0.5 ring-2',
    isFocused && $isNodeSelection(selection) && 'cursor-move',
  );

  const getFileContent = () => {
    if (isLoadError) {
      return <BrokenFile fileType={fileType} />;
    }

    switch (fileType) {
      case FileType.IMAGE:
        return (
          <LazyImage
            className={clsx(baseClassName, 'h-full w-full object-contain')}
            src={src}
            altText={altText}
            imageRef={imageRef}
            width={width}
            height={height}
            maxWidth={maxWidth}
            onError={() => setIsLoadError(true)}
          />
        );
      case FileType.AUDIO:
        return <AudioPlayer src={src} altText={altText} className={baseClassName} />;
      case FileType.VIDEO:
        return <VideoPlayer src={src} altText={altText} className={baseClassName} />;
      default:
        return (
          <FileRenderer
            src={src}
            fileName={fileName}
            fileType={fileType}
            fileAlt={altText}
            className={baseClassName}
          />
        );
    }
  };

  return (
    <Suspense fallback={<Spinner />}>
      <div draggable={draggable} className='relative w-full' ref={fileRef}>
        {getFileContent()}
      </div>
    </Suspense>
  );
}
