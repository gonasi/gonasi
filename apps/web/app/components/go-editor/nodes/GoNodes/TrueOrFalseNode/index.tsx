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

import TrueOrFalseFallback from './TrueOrFalseFallback';

// Define a React component for the node
const TrueOrFalseComponent = React.lazy(() => import('./TrueOrFalseComponent'));

export interface TrueOrFalseBase {
  questionState: SerializedEditorState;
  correctAnswer: boolean;
  hint?: string;
  explanationState: SerializedEditorState;
  uuid: string;
}

export type SerializedTrueOrFalseNode = Spread<TrueOrFalseBase, SerializedLexicalNode>;

// DOM conversion function for importing HTML
function $convertTrueOrFalseElement(domNode: HTMLElement): DOMConversionOutput | null {
  const questionStateJson = domNode.getAttribute('data-lexical-true-or-false-question');
  const correctAnswer = domNode.getAttribute('data-lexical-true-or-false-answer');
  const hint = domNode.getAttribute('data-lexical-true-or-false-hint');
  const explanationStateJson = domNode.getAttribute('data-lexical-true-or-false-explanation');

  if (questionStateJson !== null && explanationStateJson !== null && correctAnswer !== null) {
    try {
      // Parse the serialized EditorState
      const questionState = JSON.parse(questionStateJson);
      const explanationState = JSON.parse(explanationStateJson);
      const node = $createTrueOrFalseNode(
        questionState,
        explanationState,
        correctAnswer === 'true',
        hint || undefined,
      );
      return { node };
    } catch (error) {
      console.error('Error parsing true-or-false question state:', error);
    }
  }
  return null;
}

// Reusable state wrappers for reactive data
const questionStateWrapper = makeStateWrapper<'questionState', SerializedEditorState>(
  createState('questionState', {
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

const correctAnswerState = makeStateWrapper(
  createState('correctAnswer', {
    parse: (v) => Boolean(v),
  }),
);

const hintState = makeStateWrapper(
  createState('hint', {
    parse: (v) => (typeof v === 'string' ? v : undefined),
  }),
);

const explanationStateWrapper = makeStateWrapper<'explanationState', SerializedEditorState>(
  createState('explanationState', {
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

export class TrueOrFalseNode extends DecoratorNode<JSX.Element> {
  private __uuid: string;

  constructor(key?: NodeKey) {
    super(key);
    this.__uuid = crypto.randomUUID();
  }

  static getType(): string {
    return 'true-or-false';
  }

  static isBlock(): boolean {
    return true;
  }

  static clone(node: TrueOrFalseNode): TrueOrFalseNode {
    const clonedNode = new TrueOrFalseNode(node.__key);
    clonedNode.__uuid = node.__uuid;
    return clonedNode;
  }

  static importJSON(serializedNode: SerializedTrueOrFalseNode): TrueOrFalseNode {
    const node = new TrueOrFalseNode();
    node.__uuid = serializedNode.uuid;
    node.setQuestionState(serializedNode.questionState);
    node.setCorrectAnswer(serializedNode.correctAnswer);
    node.setHint(serializedNode.hint);
    node.setExplanationState(serializedNode.explanationState);
    return node;
  }

  getQuestionState = questionStateWrapper.makeGetterMethod<this>();
  setQuestionState = questionStateWrapper.makeSetterMethod<this>();

  getCorrectAnswer = correctAnswerState.makeGetterMethod<this>();
  setCorrectAnswer = correctAnswerState.makeSetterMethod<this>();

  getHint = hintState.makeGetterMethod<this>();
  setHint = hintState.makeSetterMethod<this>();

  getExplanationState = explanationStateWrapper.makeGetterMethod<this>();
  setExplanationState = explanationStateWrapper.makeSetterMethod<this>();

  exportJSON(): SerializedTrueOrFalseNode {
    return {
      ...super.exportJSON(),
      questionState: this.getQuestionState() as SerializedEditorState,
      correctAnswer: this.getCorrectAnswer(),
      hint: this.getHint(),
      explanationState: this.getExplanationState() as SerializedEditorState,
      uuid: this.__uuid,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-true-or-false-question')) {
          return null;
        }
        return {
          conversion: $convertTrueOrFalseElement,
          priority: 2,
        };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute(
      'data-lexical-true-or-false-question',
      JSON.stringify(this.getQuestionState()),
    );
    element.setAttribute('data-lexical-true-or-false-answer', String(this.getCorrectAnswer()));

    const hint = this.getHint();
    if (hint) {
      element.setAttribute('data-lexical-true-or-false-hint', hint);
    }

    element.setAttribute(
      'data-lexical-true-or-false-explanation',
      JSON.stringify(this.getExplanationState()),
    );

    return { element };
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'true-or-false-node';
    div.setAttribute('data-uuid', this.__uuid);
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <React.Suspense fallback={<TrueOrFalseFallback />}>
        <TrueOrFalseComponent
          nodeKey={this.__key}
          questionState={this.getQuestionState()}
          correctAnswer={this.getCorrectAnswer()}
          hint={this.getHint()}
          explanationState={this.getExplanationState()}
          uuid={this.__uuid}
        />
      </React.Suspense>
    );
  }

  getUuid(): string {
    return this.__uuid;
  }
}

export function $createTrueOrFalseNode(
  questionState: SerializedEditorState,
  explanationState: SerializedEditorState,
  correctAnswer: boolean = true,
  hint?: string,
): TrueOrFalseNode {
  return new TrueOrFalseNode()
    .setQuestionState(questionState)
    .setCorrectAnswer(correctAnswer)
    .setHint(hint)
    .setExplanationState(explanationState);
}

export function $isTrueOrFalseNode(node: LexicalNode | null | undefined): node is TrueOrFalseNode {
  return node instanceof TrueOrFalseNode;
}
