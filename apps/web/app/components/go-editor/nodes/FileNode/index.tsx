import type { JSX } from 'react';
import * as React from 'react';
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { $applyNodeReplacement, DecoratorNode } from 'lexical';

import { FileComponentFallback } from './FileComponentFallback';

const LazyFileComponent = React.lazy(() => import('./FileComponent'));

// Define file type categories
export enum FileType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  MODEL_3D = 'model3d',
  DOCUMENT = 'document',
  OTHER = 'other',
}

// Helper function to determine file type from extension
export function getFileTypeFromMimeOrExtension(file: string): FileType {
  const extension = file.includes('.') ? file.split('.').pop()?.toLowerCase() : '';

  // Check if it's a data URL and extract MIME type
  if (file.startsWith('data:')) {
    const mimeType = file.split(',')[0].split(':')[1].split(';')[0];

    if (mimeType.startsWith('image/')) return FileType.IMAGE;
    if (mimeType.startsWith('audio/')) return FileType.AUDIO;
    if (mimeType.startsWith('video/')) return FileType.VIDEO;
    if (mimeType.startsWith('model/') || mimeType.includes('gltf') || mimeType.includes('obj'))
      return FileType.MODEL_3D;
    if (mimeType.startsWith('application/') || mimeType.startsWith('text/'))
      return FileType.DOCUMENT;
    return FileType.OTHER;
  }

  // Image formats
  if (
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff', 'heic'].includes(extension)
  ) {
    return FileType.IMAGE;
  }
  // Audio formats
  if (['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'aiff', 'aif'].includes(extension)) {
    return FileType.AUDIO;
  }
  // Video formats
  if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(extension)) {
    return FileType.VIDEO;
  }
  // 3D model formats
  if (['gltf', 'glb', 'obj', 'fbx', 'stl', 'dae', '3ds', 'usdz'].includes(extension)) {
    return FileType.MODEL_3D;
  }
  // Document formats (you can extend this as needed)
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(extension)) {
    return FileType.DOCUMENT;
  }

  return FileType.OTHER;
}

export interface FilePayload {
  altText: string;
  caption?: string;
  height?: number;
  key?: NodeKey;
  maxWidth?: number;
  showCaption?: boolean;
  src: string;
  width?: number;
  fileType?: FileType;
  fileName?: string;
}

function isGoogleDocCheckboxImg(img: HTMLImageElement): boolean {
  return (
    img.parentElement != null &&
    img.parentElement.tagName === 'LI' &&
    img.previousSibling === null &&
    img.getAttribute('aria-roledescription') === 'checkbox'
  );
}

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
  const img = domNode as HTMLImageElement;
  if (img.src.startsWith('file:///') || isGoogleDocCheckboxImg(img)) {
    return null;
  }
  const { alt: altText, src, width, height } = img;
  const node = $createFileNode({
    altText,
    height,
    src,
    width,
    fileType: FileType.IMAGE,
  });
  return { node };
}

export type SerializedFileNode = Spread<
  {
    altText: string;
    caption?: string;
    height?: number;
    maxWidth: number;
    showCaption?: boolean;
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
  __showCaption: boolean;
  __caption: string;
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
      node.__showCaption,
      node.__caption,
      node.__fileType,
      node.__fileName,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedFileNode): FileNode {
    const { altText, caption, height, width, maxWidth, src, showCaption, fileType, fileName } =
      serializedNode;
    return $createFileNode({
      altText,
      caption,
      height,
      maxWidth,
      src,
      showCaption,
      width,
      fileType: fileType || getFileTypeFromMimeOrExtension(src),
      fileName: fileName || src.split('/').pop() || 'file',
    });
  }

  exportJSON(): SerializedFileNode {
    return {
      ...super.exportJSON(),
      altText: this.getAltText(),
      caption: this.__caption,
      height: this.__height === 'inherit' ? 0 : this.__height,
      maxWidth: this.__maxWidth,
      showCaption: this.__showCaption,
      src: this.getSrc(),
      width: this.__width === 'inherit' ? 0 : this.__width,
      fileType: this.__fileType,
      fileName: this.__fileName,
    };
  }

  exportDOM(): DOMExportOutput {
    if (this.__fileType === FileType.IMAGE) {
      const element = document.createElement('img');
      element.setAttribute('src', this.__src);
      element.setAttribute('alt', this.__altText);
      element.setAttribute('width', this.__width.toString());
      element.setAttribute('height', this.__height.toString());
      return { element };
    } else {
      const element = document.createElement('a');
      element.setAttribute('href', this.__src);
      element.setAttribute('title', this.__altText);
      element.setAttribute('download', this.__fileName);
      element.textContent = this.__fileName;
      return { element };
    }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (_node: Node) => ({
        conversion: $convertImageElement,
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
    showCaption?: boolean,
    caption?: string,
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
    this.__showCaption = showCaption || false;
    this.__caption = caption || '';
    this.__fileType = fileType || getFileTypeFromMimeOrExtension(src);
    this.__fileName = fileName || src.split('/').pop() || 'file';
  }

  setWidthAndHeight(width: 'inherit' | number, height: 'inherit' | number): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setShowCaption(showCaption: boolean): void {
    const writable = this.getWritable();
    writable.__showCaption = showCaption;
  }

  setCaption(caption: string): void {
    const writable = this.getWritable();
    writable.__caption = caption;
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

  getCaption(): string {
    return this.__caption;
  }

  getFileType(): FileType {
    return this.__fileType;
  }

  getFileName(): string {
    return this.__fileName;
  }

  hasCaption(): boolean {
    return this.__showCaption;
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
          showCaption={this.__showCaption}
          caption={this.__caption}
        />
      </React.Suspense>
    );
  }
}

export function $createFileNode({
  altText,
  caption,
  height,
  maxWidth = 500,
  src,
  showCaption,
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
      showCaption,
      caption,
      fileType || getFileTypeFromMimeOrExtension(src),
      fileName || src.split('/').pop() || 'file',
      key,
    ),
  );
}

export function $isFileNode(node: LexicalNode | null | undefined): node is FileNode {
  return node instanceof FileNode;
}
