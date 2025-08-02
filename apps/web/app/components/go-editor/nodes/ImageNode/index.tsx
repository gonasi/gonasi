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

// const ImageComponent = React.lazy(() => import('./ImageComponent'));

export interface ImagePayload {
  imageId: string;
  width?: number;
  height?: number;
  maxWidth?: number;
  key?: NodeKey;
}

export type SerializedImageNode = Spread<
  {
    imageId: string;
    width?: number;
    height?: number;
    maxWidth: number;
  },
  SerializedLexicalNode
>;

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
  const div = domNode as HTMLElement;

  const imageId = div.getAttribute('data-image-id');

  if (!imageId) {
    return null;
  }

  const width = div.getAttribute('data-width');
  const height = div.getAttribute('data-height');

  const node = $createImageNode({
    imageId,
    width: width ? parseInt(width, 10) : undefined,
    height: height ? parseInt(height, 10) : undefined,
  });

  return { node };
}

export class ImageNode extends DecoratorNode<JSX.Element> {
  __imageId: string;
  __width: number | undefined;
  __height: number | undefined;
  __maxWidth: number;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__imageId, node.__maxWidth, node.__width, node.__height, node.__key);
  }

  constructor(
    imageId: string,
    maxWidth: number = 500,
    width?: number,
    height?: number,
    key?: NodeKey,
  ) {
    super(key);
    this.__imageId = imageId;
    this.__maxWidth = maxWidth;
    this.__width = width;
    this.__height = height;
  }

  // Serialization
  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { imageId, width, height, maxWidth } = serializedNode;
    return $createImageNode({
      imageId,
      width,
      height,
      maxWidth,
    });
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      imageId: this.__imageId,
      width: this.__width,
      height: this.__height,
      maxWidth: this.__maxWidth,
    };
  }

  // DOM Export/Import
  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-image-id', this.__imageId);
    element.setAttribute('data-lexical-image', 'true');

    if (this.__width) {
      element.setAttribute('data-width', this.__width.toString());
    }
    if (this.__height) {
      element.setAttribute('data-height', this.__height.toString());
    }

    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (node: Node) => {
        const div = node as HTMLElement;
        // Only convert divs that have our image marker
        if (
          div.getAttribute('data-lexical-image') === 'true' &&
          div.getAttribute('data-image-id')
        ) {
          return {
            conversion: $convertImageElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  // View
  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  // Decorator
  decorate(): JSX.Element {
    return (
      // <ImageComponent
      //   imageId={this.__imageId}
      //   width={this.__width}
      //   height={this.__height}
      //   maxWidth={this.__maxWidth}
      //   nodeKey={this.getKey()}
      // />
      <div data-image-id={this.__imageId}>
        Unpic Image component goes here (imageId: {this.__imageId})
      </div>
    );
  }

  // Getters
  getImageId(): string {
    return this.__imageId;
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

  // Setters
  setImageId(imageId: string): void {
    const writable = this.getWritable();
    writable.__imageId = imageId;
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
}

export function $createImageNode(payload: ImagePayload): ImageNode {
  const { imageId, width, height = 250, maxWidth = 500, key } = payload;

  return $applyNodeReplacement(new ImageNode(imageId, maxWidth, width, height, key));
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}

// Utility functions for working with ImageNodes
export function $getAllImageNodes(): ImageNode[] {
  const root = $getRoot();
  const imageNodes: ImageNode[] = [];

  const traverse = (node: LexicalNode) => {
    if ($isImageNode(node)) {
      imageNodes.push(node);
    }

    // Only ElementNode has getChildren method
    if (node.getType() !== 'text' && 'getChildren' in node) {
      const elementNode = node as ElementNode;
      const children = elementNode.getChildren();
      children.forEach(traverse);
    }
  };

  traverse(root);
  return imageNodes;
}

export function $findImageNodeByImageId(imageId: string): ImageNode | null {
  const imageNodes = $getAllImageNodes();
  return imageNodes.find((node) => node.getImageId() === imageId) || null;
}
