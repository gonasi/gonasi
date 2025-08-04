import type * as React from 'react';
import type { EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
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
  width: number;
  height: number;
  maxWidth?: number;
  blurHash?: string;
  cropRegion?: CropRegion;
  key?: NodeKey;
}

export type SerializedImageNode = Spread<
  {
    fileId: string;
    width: number;
    height: number;
    maxWidth?: number;
    blurHash?: string;
    cropRegion?: CropRegion;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<React.JSX.Element> {
  __fileId: string;
  __width: number;
  __height: number;
  __maxWidth?: number;
  __blurHash?: string;
  __cropRegion?: CropRegion;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__fileId,
      node.__width,
      node.__height,
      node.__maxWidth,
      node.__blurHash,
      node.__cropRegion,
      node.__key,
    );
  }

  constructor(
    fileId: string,
    width: number,
    height: number,
    maxWidth?: number,
    blurHash?: string,
    cropRegion?: CropRegion,
    key?: NodeKey,
  ) {
    super(key);
    this.__fileId = fileId;
    this.__width = width;
    this.__height = height;
    this.__maxWidth = maxWidth;
    this.__blurHash = blurHash;
    this.__cropRegion = cropRegion;
  }

  static importJSON(json: SerializedImageNode): ImageNode {
    return new ImageNode(
      json.fileId,
      json.width,
      json.height,
      json.maxWidth,
      json.blurHash,
      json.cropRegion,
    );
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      fileId: this.__fileId,
      width: this.__width,
      height: this.__height,
      maxWidth: this.__maxWidth,
      blurHash: this.__blurHash,
      cropRegion: this.__cropRegion,
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

  decorate(): React.JSX.Element {
    return <ImageComponent fileId={this.__fileId} width={this.__width} height={this.__height} />;
  }
}

export function $createImageNode(payload: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(
      payload.fileId,
      payload.width,
      payload.height,
      payload.maxWidth,
      payload.blurHash,
      payload.cropRegion,
      payload.key,
    ),
  );
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
