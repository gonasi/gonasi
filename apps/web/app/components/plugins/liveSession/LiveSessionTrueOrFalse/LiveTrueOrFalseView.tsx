import { Check, X } from 'lucide-react';

import type { LiveSessionViewComponentProps } from '../core/types';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { TrueOrFalseOptionsButton } from '~/components/ui/button';
import { cn } from '~/lib/utils';

export function LiveTrueOrFalseView({ block }: LiveSessionViewComponentProps) {
  // Type narrowing: when plugin_type is 'live_session_true_or_false',
  // TypeScript knows content has questionState and correctAnswer
  if (block.plugin_type !== 'live_session_true_or_false') {
    return null;
  }

  const { questionState } = block.content;
  const { layoutStyle } = block.settings;

  const answerOptions = [true, false];

  return (
    <div className='w-full space-y-4'>
      <RichTextRenderer editorState={questionState} />

      <div
        className={cn('gap-4 py-0', {
          'grid grid-cols-1': layoutStyle === 'single',
          'grid grid-cols-2': layoutStyle === 'double',
        })}
      >
        {answerOptions.map((val) => (
          <div key={String(val)} className='relative w-full'>
            <TrueOrFalseOptionsButton
              val={val}
              icon={val ? <Check /> : <X />}
              isSelected={false}
              isDisabled
              selectOption={() => {}}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
