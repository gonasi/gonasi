import type { JSX } from 'react';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';

import { cn } from '~/lib/utils';

interface Props {
  className?: string;
  placeholderClassName?: string;
  placeholder: string;
  readOnly?: boolean;
}

export default function LexicalContentEditable({
  className,
  placeholder,
  placeholderClassName,
  readOnly,
}: Props): JSX.Element {
  return (
    <>
      <ContentEditable
        className={cn(className, {
          'border-input min-h-20 rounded-lg border px-3 py-2': !readOnly,
          'px-4 md:px-0': readOnly,
        })}
        aria-placeholder={placeholder}
        placeholder={
          <div
            className={
              placeholderClassName ??
              'text-muted-foreground font-secondary pointer-events-none absolute top-2 right-[28px] left-[28px] inline-block overflow-hidden text-sm text-ellipsis whitespace-nowrap select-none max-[1025px]:right-2 max-[1025px]:left-2'
            }
          >
            {placeholder}
          </div>
        }
      />
    </>
  );
}
