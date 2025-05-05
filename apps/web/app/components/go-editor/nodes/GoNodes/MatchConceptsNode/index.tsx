import type { JSX } from 'react';
import * as React from 'react';
import { makeStateWrapper } from '@lexical/utils';
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedEditorState,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { createState, DecoratorNode } from 'lexical';

// Define a React component for the node
import MatchConceptsFallback from './MatchConceptsFallback';

const MatchConceptsComponent = React.lazy(() => import('./MatchConceptsComponent'));

// Helper function to validate SerializedEditorState
function isValidEditorState(value: any): value is SerializedEditorState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'root' in value &&
    typeof value.root === 'object' &&
    value.root !== null &&
    'children' in value.root
  );
}

// Helper function to validate MatchConceptItem
function isValidMatchConceptItem(item: any): item is MatchConceptItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'item' in item &&
    'value' in item &&
    isValidEditorState(item.item) &&
    isValidEditorState(item.value)
  );
}

// Default empty editor state
const emptyEditorState: SerializedEditorState = {
  root: {
    children: [],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
};

export interface MatchConceptItem {
  item: SerializedEditorState;
  value: SerializedEditorState;
}

export interface MatchConceptsBase {
  title: SerializedEditorState;
  items: MatchConceptItem[];
  uuid: string;
}

export type SerializedMatchConceptsNode = Spread<MatchConceptsBase, SerializedLexicalNode>;

// DOM conversion function for importing HTML
function $convertMatchConceptsElement(domNode: HTMLElement): DOMConversionOutput | null {
  const titleData = domNode.getAttribute('data-lexical-match-concepts-title');
  const itemsData = domNode.getAttribute('data-lexical-match-concepts-items');

  if (titleData !== null && itemsData !== null) {
    try {
      // Parse the serialized data
      const title = JSON.parse(titleData);
      const items = JSON.parse(itemsData) as MatchConceptItem[]; // Parse items as array directly
      const node = $createMatchConceptsNode({ title, items });
      return { node };
    } catch (error) {
      console.error('Error parsing match-concepts data:', error);
    }
  }
  return null;
}

// Reusable state wrapper for title
const titleStateWrapper = makeStateWrapper<'title', SerializedEditorState>(
  createState('title', {
    parse: (v) => {
      if (isValidEditorState(v)) {
        return v;
      }
      return emptyEditorState;
    },
  }),
);

// Reusable state wrapper for items
const itemsStateWrapper = makeStateWrapper<'items', MatchConceptItem[]>(
  createState('items', {
    parse: (v) => {
      if (Array.isArray(v)) {
        // Filter out invalid items and ensure they have valid structure
        return v.filter(isValidMatchConceptItem);
      }
      return [];
    },
  }),
);

export class MatchConceptsNode extends DecoratorNode<JSX.Element> {
  private __uuid: string;

  constructor(key?: NodeKey) {
    super(key);
    this.__uuid = crypto.randomUUID();
  }

  static getType(): string {
    return 'match-concepts';
  }

  static isBlock(): boolean {
    return true;
  }

  static clone(node: MatchConceptsNode): MatchConceptsNode {
    const clonedNode = new MatchConceptsNode(node.__key);
    clonedNode.__uuid = node.__uuid;
    // clonedNode.setTitle(node.getTitle());
    // clonedNode.setItems(node.getItems());
    return clonedNode;
  }

  static importJSON(serializedNode: SerializedMatchConceptsNode): MatchConceptsNode {
    const node = new MatchConceptsNode();
    node.__uuid = serializedNode.uuid;
    node.setTitle(serializedNode.title);
    node.setItems(serializedNode.items);
    return node;
  }

  getTitle = titleStateWrapper.makeGetterMethod<this>();
  setTitle = titleStateWrapper.makeSetterMethod<this>();

  getItems = itemsStateWrapper.makeGetterMethod<this>();
  setItems = itemsStateWrapper.makeSetterMethod<this>();

  exportJSON(): SerializedMatchConceptsNode {
    return {
      ...super.exportJSON(),
      title: this.getTitle(),
      items: this.getItems(),
      uuid: this.__uuid,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-match-concepts')) {
          return null;
        }
        return {
          conversion: $convertMatchConceptsElement,
          priority: 2,
        };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-match-concepts', 'true');
    element.setAttribute('data-lexical-match-concepts-title', JSON.stringify(this.getTitle()));
    element.setAttribute('data-lexical-match-concepts-items', JSON.stringify(this.getItems()));
    element.setAttribute('data-uuid', this.__uuid);

    return { element };
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'match-concepts-node';
    div.setAttribute('data-uuid', this.__uuid);
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <React.Suspense fallback={<MatchConceptsFallback />}>
        <MatchConceptsComponent
          nodeKey={this.__key}
          title={this.getTitle()}
          items={this.getItems()}
          uuid={this.__uuid}
        />
      </React.Suspense>
    );
  }

  getUuid(): string {
    return this.__uuid;
  }
}

export function $createMatchConceptsNode(title: SerializedEditorState, items: MatchConceptItem[]) {
  const node = new MatchConceptsNode();
  node.setTitle(title);
  node.setItems(items);

  return node;
}

export function $isMatchConceptsNode(
  node: LexicalNode | null | undefined,
): node is MatchConceptsNode {
  return node instanceof MatchConceptsNode;
}
