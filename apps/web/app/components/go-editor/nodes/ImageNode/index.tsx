import type * as React from 'react';
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

import ImageComponent from './ImageComponent';

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImagePayload {
  fileId: string;
  width: 'inherit' | number;
  height: 'inherit' | number;
  maxWidth?: number;
  blurHash?: string;
  cropRegion?: CropRegion;
  key?: NodeKey;
}

export type SerializedImageNode = Spread<
  {
    fileId: string;
    width?: number;
    height?: number;
    maxWidth: number;
    blurHash?: string;
    cropRegion?: CropRegion;
  },
  SerializedLexicalNode
>;

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
  const img = domNode as HTMLImageElement;
  if (img.src.startsWith('file:///')) {
    return null;
  }
  // Since we use fileId system, we can't convert arbitrary img elements
  // Only convert if the img has a data-file-id attribute or similar
  const fileId = img.getAttribute('data-file-id');
  if (!fileId) {
    return null;
  }
  const { width, height } = img;
  const node = $createImageNode({
    fileId,
    height: height || 'inherit',
    width: width || 'inherit',
  });
  return { node };
}

export class ImageNode extends DecoratorNode<React.JSX.Element> {
  __fileId: string;
  __width: 'inherit' | number;
  __height: 'inherit' | number;
  __maxWidth: number;
  __blurHash?: string;
  __cropRegion?: CropRegion;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__fileId,
      node.__maxWidth,
      node.__width,
      node.__height,
      node.__blurHash,
      node.__cropRegion,
      node.__key,
    );
  }

  constructor(
    fileId: string,
    maxWidth: number,
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    blurHash?: string,
    cropRegion?: CropRegion,
    key?: NodeKey,
  ) {
    super(key);
    this.__fileId = fileId;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
    this.__maxWidth = maxWidth;
    this.__blurHash = blurHash;
    this.__cropRegion = cropRegion;
  }

  static importJSON(json: SerializedImageNode): ImageNode {
    const { fileId, width, height, maxWidth, blurHash, cropRegion } = json;
    return $createImageNode({
      fileId,
      width: width || 'inherit',
      height: height || 'inherit',
      maxWidth,
      blurHash,
      cropRegion,
    });
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      fileId: this.__fileId,
      width: this.__width === 'inherit' ? 0 : this.__width,
      height: this.__height === 'inherit' ? 0 : this.__height,
      maxWidth: this.__maxWidth,
      blurHash: this.__blurHash,
      cropRegion: this.__cropRegion,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    // Store fileId in data attribute since we can't generate signed URL here
    element.setAttribute('data-file-id', this.__fileId);
    element.setAttribute('alt', '');
    // Set placeholder src - the actual signed URL will be loaded by ImageComponent
    element.setAttribute(
      'src',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGM0Y0RjYiLz48L3N2Zz4=',
    );
    if (this.__width !== 'inherit') {
      element.setAttribute('width', this.__width.toString());
    }
    if (this.__height !== 'inherit') {
      element.setAttribute('height', this.__height.toString());
    }
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (_node: Node) => ({
        conversion: $convertImageElement,
        priority: 0,
      }),
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const className = config.theme?.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  // Methods for resizing functionality
  setWidthAndHeight(width: 'inherit' | number, height: 'inherit' | number): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setCropRegion(cropRegion?: CropRegion): void {
    const writable = this.getWritable();
    writable.__cropRegion = cropRegion;
  }

  // Getters
  getFileId(): string {
    return this.__fileId;
  }

  getWidth(): 'inherit' | number {
    return this.__width;
  }

  getHeight(): 'inherit' | number {
    return this.__height;
  }

  getCropRegion(): CropRegion | undefined {
    return this.__cropRegion;
  }

  decorate(): React.JSX.Element {
    return (
      <ImageComponent
        fileId={this.__fileId}
        width={this.__width}
        height={this.__height}
        maxWidth={this.__maxWidth}
        blurHash={this.__blurHash}
        nodeKey={this.getKey()}
        cropRegion={this.__cropRegion}
      />
    );
  }
}

export function $createImageNode({
  fileId,
  width,
  height,
  maxWidth = 500,
  blurHash,
  cropRegion,
  key,
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(fileId, maxWidth, width, height, blurHash, cropRegion, key),
  );
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
