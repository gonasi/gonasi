import type { JSX } from 'react';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';

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
  return (
    <>
      <ContentEditable
        className={cn(className, {
          'border-input min-h-20 rounded-lg border px-3 py-2': !readOnly,
          'px-4 md:px-0': readOnly,
          'border-danger': hasError,
        })}
        aria-placeholder={placeholder}
        placeholder={
          <div
            className={
              placeholderClassName ??
              'text-muted-foreground font-secondary pointer-events-none absolute top-16 right-[28px] left-3 inline-block overflow-hidden text-xs text-ellipsis whitespace-nowrap select-none md:text-sm'
            }
          >
            {placeholder}
          </div>
        }
      />
    </>
  );
}
