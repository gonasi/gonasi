import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useFetcher, useParams } from 'react-router';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import type {
  DOMConversionMap,
  DOMConversionOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
} from 'lexical';
import {
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DecoratorNode,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from 'lexical';
import { ScissorsLineDashed } from 'lucide-react';

import type { NodeProgressMap, PageBreakNodePayload } from '@gonasi/database/lessons';

import { ContinueButton } from '../../ui/ContinueButton';

import { cn } from '~/lib/utils';
import { useStore } from '~/store';

export type SerializedPageBreakNode = SerializedLexicalNode & {
  uuid: string;
};

function PageBreakComponent({ nodeKey, uuid }: { nodeKey: NodeKey; uuid: string }) {
  const [editor] = useLexicalComposerContext();
  const { nodeProgress, optimisticallyUpdateNodeProgress } = useStore();
  const fetcher = useFetcher();
  const params = useParams();

  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const isEditable = editor.isEditable();
  const [loading, setLoading] = useState(false);

  const $onDelete = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault();
      const selection = $getSelection();
      if (isSelected && $isNodeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if ($isPageBreakNode(node)) {
            node.remove();
          }
        });
      }
      return false;
    },
    [isSelected],
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          const pbElem = editor.getElementByKey(nodeKey);
          if (event.target === pbElem) {
            if (!event.shiftKey) {
              clearSelection();
            }
            setSelected(!isSelected);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
    );
  }, [clearSelection, editor, isSelected, nodeKey, $onDelete, setSelected]);

  useEffect(() => {
    setLoading(fetcher.state === 'submitting');
  }, [fetcher.state]);

  const handleSave = useCallback(() => {
    const formData = new FormData();

    const payload: PageBreakNodePayload = {
      uuid,
      nodeType: 'page-break',
      timestamp: new Date().toISOString(),
    };

    formData.append('intent', 'addGoInteractive');
    formData.append('payload', JSON.stringify(payload));

    // Cast to unknown first and then to the target type to satisfy TypeScript
    const progressUpdate = {
      [uuid]: {
        type: 'page-break' as const,
        payload,
      },
    } as unknown as Partial<NodeProgressMap>;

    // Optimistic update in Zustand store
    optimisticallyUpdateNodeProgress(progressUpdate);

    // Submit the update to server
    fetcher.submit(formData, {
      method: 'post',
      action: `/go/course/${params.courseId}/${params.chapterId}/${params.lessonId}/api-interactive`,
    });
  }, [
    fetcher,
    optimisticallyUpdateNodeProgress,
    params.chapterId,
    params.courseId,
    params.lessonId,
    uuid,
  ]);

  if (!isEditable) {
    const progress = nodeProgress?.[uuid];

    return progress ? null : <ContinueButton onClick={handleSave} loading={loading} />;
  }

  return (
    <div
      className={cn(
        'border-card flex items-center justify-center border-t border-b border-dashed py-1',
      )}
    >
      <ScissorsLineDashed />
      <span>Page Break</span>
    </div>
  );
}

export class PageBreakNode extends DecoratorNode<JSX.Element> {
  private __uuid: string;

  constructor(key?: NodeKey) {
    super(key);
    this.__uuid = crypto.randomUUID();
  }

  static getType(): string {
    return 'page-break';
  }

  static clone(node: PageBreakNode): PageBreakNode {
    const clonedNode = new PageBreakNode(node.__key);
    clonedNode.__uuid = node.__uuid;
    return clonedNode;
  }

  static importJSON(serializedNode: SerializedPageBreakNode): PageBreakNode {
    const node = new PageBreakNode();
    node.__uuid = serializedNode.uuid;
    return node;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      figure: (domNode: HTMLElement) => {
        if (domNode.getAttribute('type') !== this.getType()) {
          return null;
        }
        return {
          conversion: $convertPageBreakElement,
          priority: COMMAND_PRIORITY_HIGH,
        };
      },
    };
  }

  createDOM(): HTMLElement {
    const el = document.createElement('figure');
    el.setAttribute('type', this.getType());
    el.setAttribute('data-uuid', this.__uuid);
    return el;
  }

  getTextContent(): string {
    return '\n';
  }

  isInline(): false {
    return false;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return <PageBreakComponent nodeKey={this.__key} uuid={this.__uuid} />;
  }

  exportJSON(): SerializedPageBreakNode {
    return {
      ...super.exportJSON(),
      type: 'page-break',
      uuid: this.__uuid,
    };
  }

  getUuid(): string {
    return this.__uuid;
  }
}

function $convertPageBreakElement(): DOMConversionOutput {
  return { node: $createPageBreakNode() };
}

export function $createPageBreakNode(): PageBreakNode {
  return new PageBreakNode();
}

export function $isPageBreakNode(node: LexicalNode | null | undefined): node is PageBreakNode {
  return node instanceof PageBreakNode;
}
