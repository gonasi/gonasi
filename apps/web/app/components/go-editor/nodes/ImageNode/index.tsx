import type { JSX } from 'react';
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementNode,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { $applyNodeReplacement, $getRoot, DecoratorNode } from 'lexical';

import type { AspectRatioOption, ObjectFitType } from '@gonasi/schemas/file';
import { VALID_ASPECT_RATIOS, VALID_OBJECT_FITS } from '@gonasi/schemas/file';

import { RenderImage } from './RenderImage';

export interface ImagePayload {
  fileId: string;
  width?: number;
  height?: number;
  maxWidth?: number;
  blurHash?: string;
  objectFit?: ObjectFitType;
  aspectRatio?: AspectRatioOption;
  key?: NodeKey;
}

export type SerializedImageNode = Spread<
  {
    fileId: string;
    width?: number;
    height?: number;
    maxWidth: number;
    blurHash?: string;
    objectFit?: ObjectFitType;
    aspectRatio?: AspectRatioOption;
  },
  SerializedLexicalNode
>;

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
  const div = domNode as HTMLElement;
  const fileId = div.getAttribute('data-file-id');
  if (!fileId) return null;

  const width = div.getAttribute('data-width');
  const height = div.getAttribute('data-height');
  const blurHash = div.getAttribute('data-blur-hash') || undefined;

  const aspectRatioAttr = div.getAttribute('data-aspect-ratio');
  const aspectRatio = VALID_ASPECT_RATIOS.includes(aspectRatioAttr as AspectRatioOption)
    ? (aspectRatioAttr as AspectRatioOption)
    : undefined;

  const objectFitAttr = div.getAttribute('data-object-fit');
  const objectFit = VALID_OBJECT_FITS.includes(objectFitAttr as ObjectFitType)
    ? (objectFitAttr as ObjectFitType)
    : undefined;

  const node = $createImageNode({
    fileId,
    width: width ? parseInt(width, 10) : undefined,
    height: height ? parseInt(height, 10) : undefined,
    blurHash,
    objectFit,
    aspectRatio,
  });

  return { node };
}

export class ImageNode extends DecoratorNode<JSX.Element> {
  __fileId: string;
  __width: number | undefined;
  __height: number | undefined;
  __maxWidth: number;
  __blurHash: string | undefined;
  __objectFit: ObjectFitType | undefined;
  __aspectRatio: AspectRatioOption | undefined;

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
      node.__objectFit,
      node.__aspectRatio,
      node.__key,
    );
  }

  constructor(
    fileId: string,
    maxWidth: number = 500,
    width?: number,
    height?: number,
    blurHash?: string,
    objectFit?: ObjectFitType,
    aspectRatio?: AspectRatioOption,
    key?: NodeKey,
  ) {
    super(key);
    this.__fileId = fileId;
    this.__maxWidth = maxWidth;
    this.__width = width;
    this.__height = height;
    this.__blurHash = blurHash;
    this.__objectFit = objectFit;
    this.__aspectRatio = aspectRatio;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { fileId, width, height, maxWidth, blurHash, objectFit, aspectRatio } = serializedNode;
    return $createImageNode({
      fileId,
      width,
      height,
      maxWidth,
      blurHash,
      objectFit,
      aspectRatio,
    });
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      fileId: this.__fileId,
      width: this.__width,
      height: this.__height,
      maxWidth: this.__maxWidth,
      blurHash: this.__blurHash,
      objectFit: this.__objectFit,
      aspectRatio: this.__aspectRatio,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-image', 'true');
    element.setAttribute('data-file-id', this.__fileId);

    if (this.__width) element.setAttribute('data-width', this.__width.toString());
    if (this.__height) element.setAttribute('data-height', this.__height.toString());
    if (this.__blurHash) element.setAttribute('data-blur-hash', this.__blurHash);
    if (this.__objectFit) element.setAttribute('data-object-fit', this.__objectFit);
    if (this.__aspectRatio) element.setAttribute('data-aspect-ratio', this.__aspectRatio);

    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (node: Node) => {
        const div = node as HTMLElement;
        if (div.getAttribute('data-lexical-image') === 'true' && div.getAttribute('data-file-id')) {
          return {
            conversion: $convertImageElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className) span.className = className;
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <div data-file-id={this.__fileId}>
        <RenderImage
          fileId={this.__fileId}
          objectFit={this.__objectFit}
          blurHash={this.__blurHash}
          width={this.__width}
          height={this.__height}
        />
      </div>
    );
  }

  // Getters
  getFileId(): string {
    return this.__fileId;
  }

  getWidth(): number | undefined {
    return this.__width;
  }

  getHeight(): number | undefined {
    return this.__height;
  }

  getMaxWidth(): number {
    return this.__maxWidth;
  }

  getBlurHash(): string | undefined {
    return this.__blurHash;
  }

  getObjectFit(): ObjectFitType | undefined {
    return this.__objectFit;
  }

  getAspectRatio(): AspectRatioOption | undefined {
    return this.__aspectRatio;
  }

  // Setters
  setFileId(fileId: string): void {
    const writable = this.getWritable();
    writable.__fileId = fileId;
  }

  setWidthAndHeight(width?: number, height?: number): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setMaxWidth(maxWidth: number): void {
    const writable = this.getWritable();
    writable.__maxWidth = maxWidth;
  }

  setBlurHash(blurHash?: string): void {
    const writable = this.getWritable();
    writable.__blurHash = blurHash;
  }

  setObjectFit(objectFit?: ObjectFitType): void {
    const writable = this.getWritable();
    writable.__objectFit = objectFit;
  }

  setAspectRatio(aspectRatio?: AspectRatioOption): void {
    const writable = this.getWritable();
    writable.__aspectRatio = aspectRatio;
  }

  setImageStyling(options: {
    blurHash?: string;
    objectFit?: ObjectFitType;
    aspectRatio?: AspectRatioOption;
  }): void {
    const writable = this.getWritable();
    if (options.blurHash !== undefined) writable.__blurHash = options.blurHash;
    if (options.objectFit !== undefined) writable.__objectFit = options.objectFit;
    if (options.aspectRatio !== undefined) writable.__aspectRatio = options.aspectRatio;
  }
}

// Factory
export function $createImageNode(payload: ImagePayload): ImageNode {
  const {
    fileId,
    width,
    height = 250,
    maxWidth = 500,
    blurHash,
    objectFit = 'cover',
    aspectRatio = '16/9',
    key,
  } = payload;

  return $applyNodeReplacement(
    new ImageNode(fileId, maxWidth, width, height, blurHash, objectFit, aspectRatio, key),
  );
}

// Type guard
export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}

// Utility
export function $getAllImageNodes(): ImageNode[] {
  const root = $getRoot();
  const imageNodes: ImageNode[] = [];

  const traverse = (node: LexicalNode) => {
    if ($isImageNode(node)) {
      imageNodes.push(node);
    }

    if (node.getType() !== 'text' && 'getChildren' in node) {
      const elementNode = node as ElementNode;
      elementNode.getChildren().forEach(traverse);
    }
  };

  traverse(root);
  return imageNodes;
}

export function $findImageNodeByFileId(fileId: string): ImageNode | null {
  const imageNodes = $getAllImageNodes();
  return imageNodes.find((node) => node.getFileId() === fileId) || null;
}
