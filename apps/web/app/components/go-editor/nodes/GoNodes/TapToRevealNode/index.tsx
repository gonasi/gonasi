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

import TapToRevealFallback from './TapToRevealFallback';

// Define a React component for the node
const TapToRevealComponent = React.lazy(() => import('./TapToRevealComponent'));

export interface TapToRevealBase {
  frontSideState: SerializedEditorState;
  backSideState: SerializedEditorState;
  uuid: string;
}

export type SerializedTapToRevealNode = Spread<TapToRevealBase, SerializedLexicalNode>;

// DOM conversion function for importing HTML
function $convertTapToRevealElement(domNode: HTMLElement): DOMConversionOutput | null {
  const frontSideStateJson = domNode.getAttribute('data-lexical-tap-to-reveal-front-side-state');
  const backSideStateJson = domNode.getAttribute('data-lexical-tap-to-reveal-back-side-state');

  if (frontSideStateJson !== null && backSideStateJson !== null) {
    try {
      // Parse the serialized EditorState
      const frontSideState = JSON.parse(frontSideStateJson);
      const backSideState = JSON.parse(backSideStateJson);
      const node = $createTapToRevealNode(frontSideState, backSideState);
      return { node };
    } catch (error) {
      console.error('Error parsing tap-to-reveal question state:', error);
    }
  }
  return null;
}

// Reusable state wrappers for reactive data
const questionStateWrapper = makeStateWrapper<'frontSideState', SerializedEditorState>(
  createState('frontSideState', {
    parse: (v) => {
      if (typeof v === 'object' && v !== null && 'root' in v) {
        return v as SerializedEditorState;
      }
      return {
        root: {
          children: [],
          direction: null,
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      };
    },
  }),
);

const backSideStateWrapper = makeStateWrapper<'backSideState', SerializedEditorState>(
  createState('backSideState', {
    parse: (v) => {
      if (typeof v === 'object' && v !== null && 'root' in v) {
        return v as SerializedEditorState;
      }
      return {
        root: {
          children: [],
          direction: null,
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      };
    },
  }),
);

export class TapToRevealNode extends DecoratorNode<JSX.Element> {
  private __uuid: string;

  constructor(key?: NodeKey) {
    super(key);
    this.__uuid = crypto.randomUUID();
  }

  static getType(): string {
    return 'tap-to-reveal';
  }

  static isBlock(): boolean {
    return true;
  }

  static clone(node: TapToRevealNode): TapToRevealNode {
    const clonedNode = new TapToRevealNode(node.__key);
    clonedNode.__uuid = node.__uuid;
    return clonedNode;
  }

  static importJSON(serializedNode: SerializedTapToRevealNode): TapToRevealNode {
    const node = new TapToRevealNode();
    node.__uuid = serializedNode.uuid;
    node.setQuestionState(serializedNode.frontSideState);
    node.setExplanationState(serializedNode.backSideState);
    return node;
  }

  getQuestionState = questionStateWrapper.makeGetterMethod<this>();
  setQuestionState = questionStateWrapper.makeSetterMethod<this>();

  getExplanationState = backSideStateWrapper.makeGetterMethod<this>();
  setExplanationState = backSideStateWrapper.makeSetterMethod<this>();

  exportJSON(): SerializedTapToRevealNode {
    return {
      ...super.exportJSON(),
      frontSideState: this.getQuestionState() as SerializedEditorState,
      backSideState: this.getExplanationState() as SerializedEditorState,
      uuid: this.__uuid,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-tap-to-reveal-question')) {
          return null;
        }
        return {
          conversion: $convertTapToRevealElement,
          priority: 2,
        };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute(
      'data-lexical-tap-to-reveal-question',
      JSON.stringify(this.getQuestionState()),
    );
    element.setAttribute(
      'data-lexical-tap-to-reveal-explanation',
      JSON.stringify(this.getExplanationState()),
    );

    return { element };
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'tap-to-reveal-node';
    div.setAttribute('data-uuid', this.__uuid);
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <React.Suspense fallback={<TapToRevealFallback />}>
        <TapToRevealComponent
          nodeKey={this.__key}
          frontSideState={this.getQuestionState()}
          backSideState={this.getExplanationState()}
          uuid={this.__uuid}
        />
      </React.Suspense>
    );
  }

  getUuid(): string {
    return this.__uuid;
  }
}

export function $createTapToRevealNode(
  frontSideState: SerializedEditorState,
  backSideState: SerializedEditorState,
): TapToRevealNode {
  return new TapToRevealNode().setQuestionState(frontSideState).setExplanationState(backSideState);
}

export function $isTapToRevealNode(node: LexicalNode | null | undefined): node is TapToRevealNode {
  return node instanceof TapToRevealNode;
}
