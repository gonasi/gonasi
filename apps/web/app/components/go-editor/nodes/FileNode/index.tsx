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

const FileComponent = React.lazy(() => import('./FileComponent'));

export interface FilePayload {
  fileId: string;
  key?: NodeKey;
}

export type SerializedFileNode = Spread<
  {
    fileId: string;
  },
  SerializedLexicalNode
>;

export class FileNode extends DecoratorNode<JSX.Element> {
  __fileId: string;

  static getType(): string {
    return 'file';
  }

  static clone(node: FileNode): FileNode {
    return new FileNode(node.__fileId, node.__key);
  }

  constructor(fileId: string, key?: NodeKey) {
    super(key);
    this.__fileId = fileId;
  }

  static importJSON(serializedNode: SerializedFileNode): FileNode {
    const { fileId } = serializedNode;
    return $createFileNode({ fileId });
  }

  exportJSON(): SerializedFileNode {
    return {
      ...super.exportJSON(),
      fileId: this.__fileId,
    };
  }

  // DOM Export
  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-file-id', this.__fileId);
    return { element };
  }

  // DOM Import
  static importDOM(): DOMConversionMap | null {
    return {
      a: (node: Node) => {
        const element = node as HTMLAnchorElement;
        const fileId = element.getAttribute('data-file-id');

        if (fileId) {
          return {
            conversion: () => {
              return {
                node: $createFileNode({ fileId }),
              };
            },
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
    const className = theme.file;
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
    return <FileComponent fileId={this.__fileId} nodeKey={this.getKey()} />;
  }

  // Getter
  getFileId(): string {
    return this.__fileId;
  }
}

export function $createFileNode({ fileId, key }: FilePayload): FileNode {
  return $applyNodeReplacement(new FileNode(fileId, key));
}

export function $isFileNode(node: LexicalNode | null | undefined): node is FileNode {
  return node instanceof FileNode;
}
