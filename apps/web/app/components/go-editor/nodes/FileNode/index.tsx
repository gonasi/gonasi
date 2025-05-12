import type { JSX } from 'react';
import * as React from 'react';
import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { $applyNodeReplacement, DecoratorNode } from 'lexical';

import { ALLOWED_EXTENSIONS, FileType } from '@gonasi/schemas/file';

import { FileComponentFallback } from './FileComponentFallback';

const LazyFileComponent = React.lazy(() => import('./FileComponent'));

export function getFileTypeFromMimeOrExtension(file: string): FileType {
  const extension = file.includes('.') ? (file.split('.').pop()?.toLowerCase() ?? '') : '';

  if (file.startsWith('data:')) {
    try {
      const parts = file.split(',');
      const firstPart = parts[0] ?? '';
      const mimeType = (firstPart.split(':')[1] ?? '').split(';')[0] ?? '';

      if (mimeType.startsWith('image/')) return FileType.IMAGE;
      if (mimeType.startsWith('audio/')) return FileType.AUDIO;
      if (mimeType.startsWith('video/')) return FileType.VIDEO;
      if (mimeType.startsWith('model/') || mimeType.includes('gltf') || mimeType.includes('obj')) {
        return FileType.MODEL_3D;
      }
      if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) {
        return FileType.DOCUMENT;
      }
    } catch (error) {
      console.error('file error: ', error);
      return FileType.OTHER;
    }
    return FileType.OTHER;
  }

  if (ALLOWED_EXTENSIONS.IMAGE.includes(extension)) return FileType.IMAGE;
  if (ALLOWED_EXTENSIONS.AUDIO.includes(extension)) return FileType.AUDIO;
  if (ALLOWED_EXTENSIONS.VIDEO.includes(extension)) return FileType.VIDEO;
  if (ALLOWED_EXTENSIONS.MODEL_3D.includes(extension)) return FileType.MODEL_3D;
  if (ALLOWED_EXTENSIONS.DOCUMENT.includes(extension)) return FileType.DOCUMENT;

  return FileType.OTHER;
}

export interface FilePayload {
  altText: string;
  src: string;
  metadata?: {
    path?: string;
    fileName: string;
    fileType: FileType;
    size?: number;
    width?: number | 'inherit';
    height?: number | 'inherit';
    maxWidth?: number;
  };
}

export type SerializedFileNode = Spread<
  {
    altText: string;
    src: string;
    metadata: {
      path?: string;
      fileName: string;
      fileType: FileType;
      size?: number;
      width?: number | 'inherit';
      height?: number | 'inherit';
      maxWidth?: number;
    };
    version: 1;
  },
  SerializedLexicalNode
>;

export class FileNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __metadata: {
    path?: string;
    fileName: string;
    fileType: FileType;
    size?: number;
    width: number | 'inherit';
    height: number | 'inherit';
    maxWidth: number;
  };

  static getType(): string {
    return 'file';
  }

  static clone(node: FileNode): FileNode {
    return new FileNode(node.__src, node.__altText, { ...node.__metadata }, node.__key);
  }

  static importJSON(serializedNode: SerializedFileNode): FileNode {
    const { altText, src, metadata } = serializedNode;
    return $createFileNode({
      altText,
      src,
      metadata: {
        ...metadata,
        fileType: metadata.fileType || getFileTypeFromMimeOrExtension(src),
        fileName: metadata.fileName || src.split('/').pop() || 'file',
      },
    });
  }

  exportJSON(): SerializedFileNode {
    return {
      ...super.exportJSON(),
      altText: this.__altText,
      src: this.__src,
      metadata: {
        ...this.__metadata,
        width: this.__metadata.width,
        height: this.__metadata.height,
      },
      version: 1,
    };
  }

  exportDOM(): DOMExportOutput {
    const { fileType } = this.__metadata;

    switch (fileType) {
      case FileType.IMAGE: {
        const element = document.createElement('img');
        element.setAttribute('src', this.__src);
        element.setAttribute('alt', this.__altText);
        if (this.__metadata.width !== 'inherit') {
          element.setAttribute('width', this.__metadata.width.toString());
        }
        if (this.__metadata.height !== 'inherit') {
          element.setAttribute('height', this.__metadata.height.toString());
        }
        return { element };
      }
      case FileType.AUDIO: {
        const element = document.createElement('audio');
        element.setAttribute('controls', '');
        element.setAttribute('src', this.__src);
        return { element };
      }
      case FileType.VIDEO: {
        const element = document.createElement('video');
        element.setAttribute('controls', '');
        element.setAttribute('src', this.__src);
        if (this.__metadata.width !== 'inherit') {
          element.setAttribute('width', this.__metadata.width.toString());
        }
        if (this.__metadata.height !== 'inherit') {
          element.setAttribute('height', this.__metadata.height.toString());
        }
        return { element };
      }
      default: {
        const element = document.createElement('a');
        element.setAttribute('href', this.__src);
        element.setAttribute('title', this.__altText);
        element.setAttribute('download', this.__metadata.fileName);
        element.textContent = this.__metadata.fileName;
        return { element };
      }
    }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: (domNode) => {
          const img = domNode as HTMLImageElement;
          return {
            node: $createFileNode({
              altText: img.alt,
              src: img.src,
              metadata: {
                fileName: img.src.split('/').pop() || 'image',
                fileType: FileType.IMAGE,
                width: img.width || 'inherit',
                height: img.height || 'inherit',
                maxWidth: 500,
              },
            }),
          };
        },
        priority: 0,
      }),
      audio: () => ({
        conversion: (domNode) => {
          const audio = domNode as HTMLAudioElement;
          return {
            node: $createFileNode({
              altText: audio.title || 'audio',
              src: audio.src,
              metadata: {
                fileName: audio.src.split('/').pop() || 'audio',
                fileType: FileType.AUDIO,
                maxWidth: 500,
                width: 'inherit',
                height: 'inherit',
              },
            }),
          };
        },
        priority: 0,
      }),
      video: () => ({
        conversion: (domNode) => {
          const video = domNode as HTMLVideoElement;
          return {
            node: $createFileNode({
              altText: video.title || 'video',
              src: video.src,
              metadata: {
                fileName: video.src.split('/').pop() || 'video',
                fileType: FileType.VIDEO,
                width: video.width || 'inherit',
                height: video.height || 'inherit',
                maxWidth: 500,
              },
            }),
          };
        },
        priority: 0,
      }),
      a: () => ({
        conversion: (domNode) => {
          const a = domNode as HTMLAnchorElement;
          const fileType = getFileTypeFromMimeOrExtension(a.href);
          return {
            node: $createFileNode({
              altText: a.title || a.textContent || 'file',
              src: a.href,
              metadata: {
                fileName: a.download || a.href.split('/').pop() || 'file',
                fileType,
                maxWidth: 500,
                width: 'inherit',
                height: 'inherit',
              },
            }),
          };
        },
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    altText: string,
    metadata?: {
      path?: string;
      fileName?: string;
      fileType?: FileType;
      size?: number;
      width?: number | 'inherit';
      height?: number | 'inherit';
      maxWidth?: number;
    },
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;

    const fileType = metadata?.fileType || getFileTypeFromMimeOrExtension(src);
    const fileName = metadata?.fileName || src.split('/').pop() || 'file';

    this.__metadata = {
      path: metadata?.path,
      fileName,
      fileType,
      size: metadata?.size,
      width: metadata?.width || 'inherit',
      height: metadata?.height || 'inherit',
      maxWidth: metadata?.maxWidth || 500,
    };
  }

  setWidthAndHeight(width: 'inherit' | number, height: 'inherit' | number): void {
    const writable = this.getWritable();
    writable.__metadata = {
      ...writable.__metadata,
      width,
      height,
    };
  }

  setFileType(fileType: FileType): void {
    const writable = this.getWritable();
    writable.__metadata = {
      ...writable.__metadata,
      fileType,
    };
  }

  setFileName(fileName: string): void {
    const writable = this.getWritable();
    writable.__metadata = {
      ...writable.__metadata,
      fileName,
    };
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  getFileType(): FileType {
    return this.__metadata.fileType;
  }

  getFileName(): string {
    return this.__metadata.fileName;
  }

  getWidth(): number | 'inherit' {
    return this.__metadata.width;
  }

  getHeight(): number | 'inherit' {
    return this.__metadata.height;
  }

  getMaxWidth(): number {
    return this.__metadata.maxWidth;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.file;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    const { width, height, fileType, fileName, maxWidth } = this.__metadata;
    const fallbackHeight = height === 'inherit' ? 200 : height;
    const fallbackWidth = width === 'inherit' ? '100%' : width;

    return (
      <React.Suspense
        fallback={
          <FileComponentFallback
            height={fallbackHeight}
            width={fallbackWidth}
            fileType={fileType}
          />
        }
      >
        <LazyFileComponent
          src={this.__src}
          altText={this.__altText}
          width={width}
          height={height}
          maxWidth={maxWidth}
          nodeKey={this.getKey()}
          resizable={fileType === FileType.IMAGE}
          fileType={fileType}
          fileName={fileName}
        />
      </React.Suspense>
    );
  }
}

export function $createFileNode({ altText, src, metadata }: FilePayload): FileNode {
  const fileType = metadata?.fileType || getFileTypeFromMimeOrExtension(src);
  const fileName = metadata?.fileName || src.split('/').pop() || 'file';

  return $applyNodeReplacement(
    new FileNode(src, altText, {
      ...metadata,
      fileType,
      fileName,
      width: metadata?.width !== undefined ? metadata.width : 'inherit',
      height: metadata?.height !== undefined ? metadata.height : 'inherit',
      maxWidth: metadata?.maxWidth || 500,
    }),
  );
}

export function $isFileNode(node: LexicalNode | null | undefined): node is FileNode {
  return node instanceof FileNode;
}
