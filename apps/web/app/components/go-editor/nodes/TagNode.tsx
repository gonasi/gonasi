import type { EditorConfig, LexicalEditor, LexicalNode, NodeKey } from 'lexical';
import { TextNode } from 'lexical';

export class TagNode extends TextNode {
  constructor(text: string, key?: NodeKey) {
    super(text, key);
  }

  static getType(): string {
    return 'tag';
  }

  static clone(node: TagNode): TagNode {
    return new TagNode(node.__text, node.__key);
  }

  createDOM(config: EditorConfig, _editor?: LexicalEditor): HTMLElement {
    const element = super.createDOM(config);
    return element;
  }

  updateDOM(): boolean {
    return false;
  }
}

export const $createTagNode = (text: string): TagNode => {
  return new TagNode(text);
};

export const $isTagNode = (node: LexicalNode | null | undefined): node is TagNode => {
  return node instanceof TagNode;
};
