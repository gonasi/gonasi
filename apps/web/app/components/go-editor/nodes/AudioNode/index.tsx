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

import AudioComponent from './AudioComponent';

export interface AudioPayload {
  fileId: string;
  key?: NodeKey;
}

export type SerializedAudioNode = Spread<
  {
    fileId: string;
  },
  SerializedLexicalNode
>;

function $convertAudioElement(domNode: Node): null | DOMConversionOutput {
  const audio = domNode as HTMLAudioElement;
  if (audio.src.startsWith('file:///')) {
    return null;
  }
  const fileId = audio.getAttribute('data-file-id');
  if (!fileId) {
    return null;
  }
  const node = $createAudioNode({
    fileId,
  });
  return { node };
}

export class AudioNode extends DecoratorNode<React.JSX.Element> {
  __fileId: string;

  static getType(): string {
    return 'audio';
  }

  static clone(node: AudioNode): AudioNode {
    return new AudioNode(node.__fileId, node.__key);
  }

  constructor(fileId: string, key?: NodeKey) {
    super(key);
    this.__fileId = fileId;
  }

  static importJSON(json: SerializedAudioNode): AudioNode {
    const { fileId } = json;
    return $createAudioNode({
      fileId,
    });
  }

  exportJSON(): SerializedAudioNode {
    return {
      ...super.exportJSON(),
      fileId: this.__fileId,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('audio');
    element.setAttribute('data-file-id', this.__fileId);
    element.setAttribute('controls', 'true');
    element.setAttribute('src', 'data:audio/mpeg;base64,//uQx');
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      audio: (_node: Node) => ({
        conversion: $convertAudioElement,
        priority: 0,
      }),
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const className = config.theme?.audio;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getFileId(): string {
    return this.__fileId;
  }

  decorate(): React.JSX.Element {
    return <AudioComponent fileId={this.__fileId} nodeKey={this.getKey()} />;
  }
}

export function $createAudioNode({ fileId, key }: AudioPayload): AudioNode {
  return $applyNodeReplacement(new AudioNode(fileId, key));
}

export function $isAudioNode(node: LexicalNode | null | undefined): node is AudioNode {
  return node instanceof AudioNode;
}
