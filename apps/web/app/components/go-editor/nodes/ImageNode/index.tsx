// Enhanced ImageNode with crop region support
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

import ImageComponent from './ImageComponent';

// Extended crop region interface
export interface CropRegion {
  x: number; // % from left (0–1)
  y: number; // % from top (0–1)
  width: number; // % width (0–1)
  height: number; // % height (0–1)
}

// Enhanced transformation options
export interface ImageTransformOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: string; // For Supabase: 'center', 'top', 'right top', etc.
  quality?: number; // 1-100
  format?: 'webp' | 'jpg' | 'png' | 'avif';
}

export interface ImagePayload {
  fileId: string;
  width?: number;
  height?: number;
  maxWidth?: number;
  blurHash?: string;
  objectFit?: ObjectFitType;
  aspectRatio?: AspectRatioOption;
  cropRegion?: CropRegion;
  transformOptions?: ImageTransformOptions;
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
    cropRegion?: CropRegion;
    transformOptions?: ImageTransformOptions;
  },
  SerializedLexicalNode
>;

// Utility functions for aspect ratio handling
export const ASPECT_RATIO_MAP: Record<string, number> = {
  '1/1': 1,
  '4/3': 4 / 3,
  '3/4': 3 / 4,
  '16/9': 16 / 9,
  '9/16': 9 / 16,
  '21/9': 21 / 9,
  '3/2': 3 / 2,
  '2/3': 2 / 3,
};

export function calculateDimensionsWithAspectRatio(
  targetWidth?: number,
  targetHeight?: number,
  aspectRatio?: AspectRatioOption,
  maxWidth: number = 500,
): { width: number; height: number } {
  if (!aspectRatio) {
    return {
      width: Math.min(targetWidth || maxWidth, maxWidth),
      height: targetHeight || 250,
    };
  }

  const ratio = ASPECT_RATIO_MAP[aspectRatio] || 16 / 9;

  if (targetWidth && !targetHeight) {
    const constrainedWidth = Math.min(targetWidth, maxWidth);
    return {
      width: constrainedWidth,
      height: Math.round(constrainedWidth / ratio),
    };
  }

  if (targetHeight && !targetWidth) {
    const calculatedWidth = Math.round(targetHeight * ratio);
    const constrainedWidth = Math.min(calculatedWidth, maxWidth);
    return {
      width: constrainedWidth,
      height: Math.round(constrainedWidth / ratio),
    };
  }

  if (targetWidth && targetHeight) {
    // Use provided dimensions but respect maxWidth
    const constrainedWidth = Math.min(targetWidth, maxWidth);
    return {
      width: constrainedWidth,
      height: targetHeight,
    };
  }

  // Default case
  const defaultWidth = Math.min(400, maxWidth);
  return {
    width: defaultWidth,
    height: Math.round(defaultWidth / ratio),
  };
}

// Enhanced URL builder for Supabase transformations
export function buildTransformedImageUrl(
  baseSignedUrl: string,
  options: ImageTransformOptions = {},
): string {
  try {
    const url = new URL(baseSignedUrl);

    if (options.width) url.searchParams.set('width', options.width.toString());
    if (options.height) url.searchParams.set('height', options.height.toString());
    if (options.fit) url.searchParams.set('fit', options.fit);
    if (options.position) url.searchParams.set('position', options.position);
    if (options.quality) url.searchParams.set('quality', options.quality.toString());
    if (options.format) url.searchParams.set('format', options.format);

    return url.toString();
  } catch (error) {
    console.warn('Failed to build transformed URL:', error);
    return baseSignedUrl;
  }
}

// Crop region utilities
export function applyCropRegionToTransform(
  cropRegion: CropRegion,
  _originalWidth: number,
  _originalHeight: number,
): ImageTransformOptions {
  // For Supabase, we can't do arbitrary crops, but we can simulate
  // center cropping with different positions
  const centerX = cropRegion.x + cropRegion.width / 2;
  const centerY = cropRegion.y + cropRegion.height / 2;

  // Map crop center to Supabase position
  let position = 'center';

  if (centerY < 0.33) {
    if (centerX < 0.33) position = 'left top';
    else if (centerX > 0.67) position = 'right top';
    else position = 'top';
  } else if (centerY > 0.67) {
    if (centerX < 0.33) position = 'left bottom';
    else if (centerX > 0.67) position = 'right bottom';
    else position = 'bottom';
  } else {
    if (centerX < 0.33) position = 'left';
    else if (centerX > 0.67) position = 'right';
    else position = 'center';
  }

  return {
    fit: 'cover',
    position,
  };
}

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

  // Parse crop region if present
  const cropRegionStr = div.getAttribute('data-crop-region');
  let cropRegion: CropRegion | undefined;
  if (cropRegionStr) {
    try {
      cropRegion = JSON.parse(cropRegionStr);
    } catch (e) {
      console.warn('Failed to parse crop region:', e);
    }
  }

  // Parse transform options if present
  const transformOptionsStr = div.getAttribute('data-transform-options');
  let transformOptions: ImageTransformOptions | undefined;
  if (transformOptionsStr) {
    try {
      transformOptions = JSON.parse(transformOptionsStr);
    } catch (e) {
      console.warn('Failed to parse transform options:', e);
    }
  }

  const node = $createImageNode({
    fileId,
    width: width ? parseInt(width, 10) : undefined,
    height: height ? parseInt(height, 10) : undefined,
    blurHash,
    objectFit,
    aspectRatio,
    cropRegion,
    transformOptions,
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
  __cropRegion: CropRegion | undefined;
  __transformOptions: ImageTransformOptions | undefined;

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
      node.__cropRegion,
      node.__transformOptions,
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
    cropRegion?: CropRegion,
    transformOptions?: ImageTransformOptions,
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
    this.__cropRegion = cropRegion;
    this.__transformOptions = transformOptions;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const {
      fileId,
      width,
      height,
      maxWidth,
      blurHash,
      objectFit,
      aspectRatio,
      cropRegion,
      transformOptions,
    } = serializedNode;

    return $createImageNode({
      fileId,
      width,
      height,
      maxWidth,
      blurHash,
      objectFit,
      aspectRatio,
      cropRegion,
      transformOptions,
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
      cropRegion: this.__cropRegion,
      transformOptions: this.__transformOptions,
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
    if (this.__cropRegion)
      element.setAttribute('data-crop-region', JSON.stringify(this.__cropRegion));
    if (this.__transformOptions)
      element.setAttribute('data-transform-options', JSON.stringify(this.__transformOptions));

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
    // Calculate final dimensions respecting aspect ratio
    const finalDimensions = calculateDimensionsWithAspectRatio(
      this.__width,
      this.__height,
      this.__aspectRatio,
      this.__maxWidth,
    );

    // Merge crop region with transform options
    let mergedTransformOptions = { ...this.__transformOptions };
    if (this.__cropRegion) {
      const cropTransform = applyCropRegionToTransform(
        this.__cropRegion,
        finalDimensions.width,
        finalDimensions.height,
      );
      mergedTransformOptions = { ...mergedTransformOptions, ...cropTransform };
    }

    return (
      <div data-file-id={this.__fileId}>
        <ImageComponent
          fileId={this.__fileId}
          objectFit={this.__objectFit}
          blurHash={this.__blurHash}
          width={finalDimensions.width}
          height={finalDimensions.height}
          cropRegion={this.__cropRegion}
          transformOptions={mergedTransformOptions}
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

  getCropRegion(): CropRegion | undefined {
    return this.__cropRegion;
  }

  getTransformOptions(): ImageTransformOptions | undefined {
    return this.__transformOptions;
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

  setCropRegion(cropRegion?: CropRegion): void {
    const writable = this.getWritable();
    writable.__cropRegion = cropRegion;
  }

  setTransformOptions(transformOptions?: ImageTransformOptions): void {
    const writable = this.getWritable();
    writable.__transformOptions = transformOptions;
  }

  // Batch setters for common operations
  setImageStyling(options: {
    blurHash?: string;
    objectFit?: ObjectFitType;
    aspectRatio?: AspectRatioOption;
    cropRegion?: CropRegion;
    transformOptions?: ImageTransformOptions;
  }): void {
    const writable = this.getWritable();
    if (options.blurHash !== undefined) writable.__blurHash = options.blurHash;
    if (options.objectFit !== undefined) writable.__objectFit = options.objectFit;
    if (options.aspectRatio !== undefined) writable.__aspectRatio = options.aspectRatio;
    if (options.cropRegion !== undefined) writable.__cropRegion = options.cropRegion;
    if (options.transformOptions !== undefined)
      writable.__transformOptions = options.transformOptions;
  }

  // Convenience method for resizing with aspect ratio lock
  resizeWithAspectRatio(
    targetWidth?: number,
    targetHeight?: number,
    lockAspectRatio: boolean = true,
  ): void {
    const writable = this.getWritable();

    if (lockAspectRatio && this.__aspectRatio) {
      const dimensions = calculateDimensionsWithAspectRatio(
        targetWidth,
        targetHeight,
        this.__aspectRatio,
        this.__maxWidth,
      );
      writable.__width = dimensions.width;
      writable.__height = dimensions.height;
    } else {
      if (targetWidth !== undefined) writable.__width = Math.min(targetWidth, this.__maxWidth);
      if (targetHeight !== undefined) writable.__height = targetHeight;
    }
  }
}

// Factory
export function $createImageNode(payload: ImagePayload): ImageNode {
  const {
    fileId,
    width,
    height = 250,
    maxWidth = 800,
    blurHash,
    objectFit = 'cover',
    aspectRatio = '16/9',
    cropRegion,
    transformOptions,
    key,
  } = payload;

  return $applyNodeReplacement(
    new ImageNode(
      fileId,
      maxWidth,
      width,
      height,
      blurHash,
      objectFit,
      aspectRatio,
      cropRegion,
      transformOptions,
      key,
    ),
  );
}

// Type guard
export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}

// Utility functions
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
