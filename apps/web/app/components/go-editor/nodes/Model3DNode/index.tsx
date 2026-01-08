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

import Model3DComponent from './Model3DComponent';

export interface Model3DPayload {
  fileId: string;
  width?: 'inherit' | number;
  height?: 'inherit' | number;
  maxWidth?: number;
  key?: NodeKey;
}

export type SerializedModel3DNode = Spread<
  {
    fileId: string;
    width?: 'inherit' | number;
    height?: 'inherit' | number;
    maxWidth?: number;
  },
  SerializedLexicalNode
>;

function $convertModel3DElement(domNode: Node): null | DOMConversionOutput {
  const model = domNode as HTMLElement;
  const fileId = model.getAttribute('data-file-id');
  if (!fileId) {
    return null;
  }
  const node = $createModel3DNode({
    fileId,
  });
  return { node };
}

export class Model3DNode extends DecoratorNode<React.JSX.Element> {
  __fileId: string;
  __width: 'inherit' | number;
  __height: 'inherit' | number;
  __maxWidth: number;

  static getType(): string {
    return 'model3d';
  }

  static clone(node: Model3DNode): Model3DNode {
    return new Model3DNode(node.__fileId, node.__maxWidth, node.__width, node.__height, node.__key);
  }

  constructor(
    fileId: string,
    maxWidth: number = 800,
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    key?: NodeKey,
  ) {
    super(key);
    this.__fileId = fileId;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
    this.__maxWidth = maxWidth;
  }

  static importJSON(json: SerializedModel3DNode): Model3DNode {
    const { fileId, width, height, maxWidth } = json;
    return $createModel3DNode({
      fileId,
      width,
      height,
      maxWidth,
    });
  }

  exportJSON(): SerializedModel3DNode {
    return {
      ...super.exportJSON(),
      fileId: this.__fileId,
      width: this.__width === 'inherit' ? undefined : this.__width,
      height: this.__height === 'inherit' ? undefined : this.__height,
      maxWidth: this.__maxWidth,
    };
  }

  setWidthAndHeight(width: 'inherit' | number, height: 'inherit' | number): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-file-id', this.__fileId);
    element.setAttribute('data-lexical-model3d', 'true');
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (node: Node) => {
        const element = node as HTMLElement;
        if (element.getAttribute('data-lexical-model3d') === 'true') {
          return {
            conversion: $convertModel3DElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    const className = config.theme?.model3d;
    if (className !== undefined) {
      div.className = className;
    }
    return div;
  }

  updateDOM(): false {
    return false;
  }

  getFileId(): string {
    return this.__fileId;
  }

  decorate(): React.JSX.Element {
    return (
      <Model3DComponent
        fileId={this.__fileId}
        width={this.__width}
        height={this.__height}
        maxWidth={this.__maxWidth}
        nodeKey={this.getKey()}
      />
    );
  }
}

export function $createModel3DNode({
  fileId,
  width,
  height,
  maxWidth,
  key,
}: Model3DPayload): Model3DNode {
  return $applyNodeReplacement(new Model3DNode(fileId, maxWidth, width, height, key));
}

export function $isModel3DNode(node: LexicalNode | null | undefined): node is Model3DNode {
  return node instanceof Model3DNode;
}
