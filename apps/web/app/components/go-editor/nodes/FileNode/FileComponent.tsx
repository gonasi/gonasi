import type { JSX } from 'react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import clsx from 'clsx';
import type { BaseSelection, LexicalCommand, LexicalEditor, NodeKey } from 'lexical';
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
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import {
  Box,
  Download,
  File as FileIcon,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
} from 'lucide-react';

import { $isFileNode, FileType } from '.';

import { Button } from '~/components/ui/button';

const fileCache = new Set();

export const RIGHT_CLICK_FILE_COMMAND: LexicalCommand<MouseEvent> = createCommand(
  'RIGHT_CLICK_FILE_COMMAND',
);

function useSuspenseFile(src: string) {
  if (!fileCache.has(src)) {
    throw new Promise((resolve) => {
      // For images, we need to preload
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
        // For non-image files, just mark as loaded
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
      style={{
        height,
        maxWidth,
        width,
      }}
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

function FileLink({
  src,
  fileName,
  fileType,
  className,
}: {
  src: string;
  fileName: string;
  fileType: FileType;
  className: string | null;
}): JSX.Element {
  let Icon = FileIcon;
  switch (fileType) {
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
    <div className={clsx('flex items-center gap-2 rounded-md border p-3', className)}>
      <Icon size={24} />
      <span className='flex-1 truncate'>{fileName}</span>
      <a
        href={src}
        download={fileName}
        target='_blank'
        rel='noopener noreferrer'
        onClick={(e) => e.stopPropagation()}
        className='ml-2'
      >
        <Button size='sm' variant='ghost'>
          <Download size={18} />
        </Button>
      </a>
    </div>
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
  showCaption = false,
  caption = '',
}: {
  altText: string;
  height: 'inherit' | number;
  maxWidth: number;
  nodeKey: NodeKey;
  src: string;
  width: 'inherit' | number;
  fileType: FileType;
  fileName: string;
  showCaption?: boolean;
  caption?: string;
}): JSX.Element {
  const imageRef = useRef<null | HTMLImageElement>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [selection, setSelection] = useState<BaseSelection | null>(null);
  const activeEditorRef = useRef<LexicalEditor | null>(null);
  const [isLoadError, setIsLoadError] = useState<boolean>(false);
  const isEditable = useLexicalEditable();

  const $onDelete = useCallback(
    (payload: KeyboardEvent) => {
      const deleteSelection = $getSelection();
      if (isSelected && $isNodeSelection(deleteSelection)) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        deleteSelection.getNodes().forEach((node) => {
          if ($isFileNode(node)) {
            node.remove();
          }
        });
      }
      return false;
    },
    [isSelected],
  );

  const $onEnter = useCallback(
    (event: KeyboardEvent) => {
      const latestSelection = $getSelection();
      const buttonElem = buttonRef.current;
      if (
        isSelected &&
        $isNodeSelection(latestSelection) &&
        latestSelection.getNodes().length === 1
      ) {
        if (buttonElem !== null && buttonElem !== document.activeElement) {
          event.preventDefault();
          buttonElem.focus();
          return true;
        }
      }
      return false;
    },
    [isSelected],
  );

  const $onEscape = useCallback(
    (event: KeyboardEvent) => {
      if (buttonRef.current === event.target) {
        $setSelection(null);
        editor.update(() => {
          setSelected(true);
          const parentRootElement = editor.getRootElement();
          if (parentRootElement !== null) {
            parentRootElement.focus();
          }
        });
        return true;
      }
      return false;
    },
    [editor, setSelected],
  );

  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload;

      if (isResizing) {
        return true;
      }

      // Check if the clicked element is part of our component
      if (event.currentTarget && (event.currentTarget as Node).contains(event.target as Node)) {
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
        if ($isRangeSelection(latestSelection) && latestSelection.getNodes().length === 1) {
          editor.dispatchCommand(RIGHT_CLICK_FILE_COMMAND, event as MouseEvent);
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
      editor.registerCommand<MouseEvent>(RIGHT_CLICK_FILE_COMMAND, onClick, COMMAND_PRIORITY_LOW),
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
    clearSelection,
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
  ]);

  const draggable = isSelected && $isNodeSelection(selection) && !isResizing;
  const isFocused = (isSelected || isResizing) && isEditable;

  // Render different components based on file type
  const renderFileContent = () => {
    if (isLoadError) {
      return <BrokenFile fileType={fileType} />;
    }

    const baseClassName = clsx(
      isFocused && 'ring-primary p-0.5 ring-2',
      isFocused && $isNodeSelection(selection) && 'cursor-move',
    );

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
          <FileLink src={src} fileName={fileName} fileType={fileType} className={baseClassName} />
        );
    }
  };

  return (
    <Suspense fallback={null}>
      <>
        <div draggable={draggable} className='relative w-full' onClick={onClick}>
          {renderFileContent()}

          {showCaption && (
            <div className='mt-2 text-center text-sm text-gray-500'>{caption || altText}</div>
          )}
        </div>
      </>
    </Suspense>
  );
}
