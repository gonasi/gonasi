import type { JSX } from 'react';
import { useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { $createParagraphNode, $getNearestNodeFromDOMNode } from 'lexical';
import { GripVertical, Plus } from 'lucide-react';

import { cn } from '~/lib/utils';

export default function DraggableBlockPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  const [draggableElement, setDraggableElement] = useState<HTMLElement | null>(null);

  function insertBlock(e: React.MouseEvent) {
    if (!draggableElement || !editor) return;

    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableElement);
      if (!node) return;

      const pNode = $createParagraphNode();
      if (e.altKey || e.ctrlKey) {
        node.insertBefore(pNode);
      } else {
        node.insertAfter(pNode);
      }
      pNode.select();
    });
  }

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <div
          ref={menuRef}
          className={cn(
            'absolute top-0 left-0 z-10 flex gap-1 rounded px-1 py-0.5 opacity-0 transition-opacity',
            'cursor-grab hover:opacity-100',
            'bg-white shadow-sm',
          )}
        >
          <button
            title='Click to add below'
            onClick={insertBlock}
            className={cn(
              'flex h-4 w-4 items-center justify-center text-gray-500 hover:bg-gray-200',
              'rounded transition-colors',
            )}
          >
            <Plus className='h-3 w-3' />
          </button>
          <div
            className={cn(
              'flex h-4 w-4 items-center justify-center text-gray-400 hover:bg-gray-200',
              'rounded transition-colors',
            )}
          >
            <GripVertical className='h-3 w-3' />
          </div>
        </div>
      }
      targetLineComponent={
        <div
          ref={targetLineRef}
          className={cn(
            'pointer-events-none absolute top-0 left-0 h-1 w-full bg-sky-400 opacity-0',
          )}
        />
      }
      isOnMenu={(element) => !!element.closest('.draggable-block-menu')}
      onElementChanged={setDraggableElement}
    />
  );
}
