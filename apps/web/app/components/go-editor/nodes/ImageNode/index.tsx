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

export interface ImagePayload {
  fileId: string;
  width?: number;
  height?: number;
  maxWidth?: number;
  key?: NodeKey;
}

export type SerializedImageNode = Spread<
  {
    fileId: string;
    width?: number;
    height?: number;
    maxWidth: number;
  },
  SerializedLexicalNode
>;

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
  const div = domNode as HTMLElement;

  const fileId = div.getAttribute('data-file-id');

  if (!fileId) {
    return null;
  }

  const width = div.getAttribute('data-width');
  const height = div.getAttribute('data-height');

  const node = $createImageNode({
    fileId,
    width: width ? parseInt(width, 10) : undefined,
    height: height ? parseInt(height, 10) : undefined,
  });

  return { node };
}

export class ImageNode extends DecoratorNode<JSX.Element> {
  __fileId: string;
  __width: number | undefined;
  __height: number | undefined;
  __maxWidth: number;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__fileId, node.__maxWidth, node.__width, node.__height, node.__key);
  }

  constructor(
    fileId: string,
    maxWidth: number = 500,
    width?: number,
    height?: number,
    key?: NodeKey,
  ) {
    super(key);
    this.__fileId = fileId;
    this.__maxWidth = maxWidth;
    this.__width = width;
    this.__height = height;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { fileId, width, height, maxWidth } = serializedNode;
    return $createImageNode({
      fileId,
      width,
      height,
      maxWidth,
    });
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      fileId: this.__fileId,
      width: this.__width,
      height: this.__height,
      maxWidth: this.__maxWidth,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-file-id', this.__fileId);
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
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <div data-file-id={this.__fileId}>
        Unpic Image component goes here (fileId: {this.__fileId})
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
}

// Node creation
export function $createImageNode(payload: ImagePayload): ImageNode {
  const { fileId, width, height = 250, maxWidth = 500, key } = payload;
  return $applyNodeReplacement(new ImageNode(fileId, maxWidth, width, height, key));
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
      const children = elementNode.getChildren();
      children.forEach(traverse);
    }
  };

  traverse(root);
  return imageNodes;
}

export function $findImageNodeByFileId(fileId: string): ImageNode | null {
  const imageNodes = $getAllImageNodes();
  return imageNodes.find((node) => node.getFileId() === fileId) || null;
}
