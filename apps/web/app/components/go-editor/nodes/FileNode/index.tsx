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
  height?: number;
  key?: NodeKey;
  maxWidth?: number;
  src: string;
  width?: number;
  fileType?: FileType;
  fileName?: string;
}

export type SerializedFileNode = Spread<
  {
    altText: string;
    height?: number;
    maxWidth: number;
    src: string;
    width?: number;
    fileType: FileType;
    fileName?: string;
  },
  SerializedLexicalNode
>;

export class FileNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: 'inherit' | number;
  __height: 'inherit' | number;
  __maxWidth: number;
  __fileType: FileType;
  __fileName: string;

  static getType(): string {
    return 'file';
  }

  static clone(node: FileNode): FileNode {
    return new FileNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__width,
      node.__height,
      node.__fileType,
      node.__fileName,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedFileNode): FileNode {
    const { altText, height, width, maxWidth, src, fileType, fileName } = serializedNode;
    return $createFileNode({
      altText,
      height,
      maxWidth,
      src,
      width,
      fileType: fileType || getFileTypeFromMimeOrExtension(src),
      fileName: fileName || src.split('/').pop() || 'file',
    });
  }

  exportJSON(): SerializedFileNode {
    return {
      ...super.exportJSON(),
      altText: this.getAltText(),
      height: this.__height === 'inherit' ? 0 : this.__height,
      maxWidth: this.__maxWidth,
      src: this.getSrc(),
      width: this.__width === 'inherit' ? 0 : this.__width,
      fileType: this.__fileType,
      fileName: this.__fileName,
    };
  }

  exportDOM(): DOMExportOutput {
    switch (this.__fileType) {
      case FileType.IMAGE: {
        const element = document.createElement('img');
        element.setAttribute('src', this.__src);
        element.setAttribute('alt', this.__altText);
        element.setAttribute('width', this.__width.toString());
        element.setAttribute('height', this.__height.toString());
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
        element.setAttribute('width', this.__width.toString());
        element.setAttribute('height', this.__height.toString());
        return { element };
      }
      default: {
        const element = document.createElement('a');
        element.setAttribute('href', this.__src);
        element.setAttribute('title', this.__altText);
        element.setAttribute('download', this.__fileName);
        element.textContent = this.__fileName;
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
              height: img.height,
              width: img.width,
              src: img.src,
              fileType: FileType.IMAGE,
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
              fileType: FileType.AUDIO,
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
              fileType: FileType.VIDEO,
            }),
          };
        },
        priority: 0,
      }),
      a: () => ({
        conversion: (domNode) => {
          const a = domNode as HTMLAnchorElement;
          return {
            node: $createFileNode({
              altText: a.title || a.textContent || 'file',
              src: a.href,
              fileType: getFileTypeFromMimeOrExtension(a.href),
              fileName: a.download || a.href.split('/').pop() || 'file',
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
    maxWidth: number,
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    fileType?: FileType,
    fileName?: string,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__maxWidth = maxWidth;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
    this.__fileType = fileType || getFileTypeFromMimeOrExtension(src);
    this.__fileName = fileName || src.split('/').pop() || 'file';
  }

  setWidthAndHeight(width: 'inherit' | number, height: 'inherit' | number): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setFileType(fileType: FileType): void {
    const writable = this.getWritable();
    writable.__fileType = fileType;
  }

  setFileName(fileName: string): void {
    const writable = this.getWritable();
    writable.__fileName = fileName;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  getFileType(): FileType {
    return this.__fileType;
  }

  getFileName(): string {
    return this.__fileName;
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
    const fallbackHeight = this.__height === 'inherit' ? 200 : this.__height;
    const fallbackWidth = this.__width === 'inherit' ? '100%' : this.__width;

    return (
      <React.Suspense
        fallback={
          <FileComponentFallback
            height={fallbackHeight}
            width={fallbackWidth}
            fileType={this.__fileType}
          />
        }
      >
        <LazyFileComponent
          src={this.__src}
          altText={this.__altText}
          width={this.__width}
          height={this.__height}
          maxWidth={this.__maxWidth}
          nodeKey={this.getKey()}
          resizable={this.__fileType === FileType.IMAGE}
          fileType={this.__fileType}
          fileName={this.__fileName}
        />
      </React.Suspense>
    );
  }
}

export function $createFileNode({
  altText,
  height,
  maxWidth = 500,
  src,
  width,
  fileType,
  fileName,
  key,
}: FilePayload): FileNode {
  return $applyNodeReplacement(
    new FileNode(
      src,
      altText,
      maxWidth,
      width,
      height,
      fileType || getFileTypeFromMimeOrExtension(src),
      fileName || src.split('/').pop() || 'file',
      key,
    ),
  );
}

export function $isFileNode(node: LexicalNode | null | undefined): node is FileNode {
  return node instanceof FileNode;
}
