import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { $getRoot, $isElementNode, $isTextNode } from 'lexical';

import { cn } from '~/lib/utils';

interface Props {
  className?: string;
  placeholderClassName?: string;
  placeholder: string;
  readOnly?: boolean;
  hasError?: boolean;
}

export default function LexicalContentEditable({
  className,
  placeholder,
  placeholderClassName,
  readOnly,
  hasError,
}: Props): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const isEmptyDoc = root.getChildren().every((node) => {
          if ($isTextNode(node)) {
            return node.getTextContent().trim() === '';
          }
          if ($isElementNode(node)) {
            return node.getChildrenSize() === 0;
          }
          return true;
        });

        setIsEmpty(isEmptyDoc);
      });
    });
  }, [editor]);

  return (
    <div className='relative'>
      <ContentEditable
        className={cn(className, {
          'border-input min-h-20 rounded-lg border px-3 py-2': !readOnly,
          'px-4 md:px-0': readOnly,
          'border-danger': hasError,
        })}
        aria-placeholder={placeholder}
        placeholder={<div className='hidden' />}
      />
      {!readOnly && isEmpty && (
        <div
          className={cn(
            'text-muted-foreground font-secondary pointer-events-none absolute top-5 left-3 text-xs select-none md:text-sm',
            placeholderClassName,
          )}
        >
          {placeholder}
        </div>
      )}
    </div>
  );
}
