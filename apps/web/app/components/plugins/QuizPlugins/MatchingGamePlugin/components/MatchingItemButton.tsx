import { Check, X } from 'lucide-react';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { cn } from '~/lib/utils';

interface MatchingItemButtonProps {
  content: string;
  isSelected?: boolean;
  isMatched?: boolean;
  isDisabled?: boolean;
  isWrong?: boolean;
  onClick?: () => void;
}

export function MatchingItemButton({
  content,
  isSelected = false,
  isMatched = false,
  isDisabled = false,
  isWrong = false,
  onClick,
}: MatchingItemButtonProps) {
  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      type='button'
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        'border-border flex w-full items-center justify-between gap-3 rounded-lg border p-4 text-left transition-all',
        // Base state
        !isMatched && !isSelected && !isDisabled && 'hover:border-primary hover:bg-accent',
        // Selected state
        isSelected && !isMatched && 'border-primary bg-primary/10',
        // Matched state
        isMatched && 'bg-success/10 border-success cursor-not-allowed',
        // Disabled state (wrong attempt)
        isDisabled && !isMatched && 'cursor-not-allowed opacity-50',
        // Disabled state
        isDisabled && 'cursor-not-allowed',
      )}
    >
      <div className='flex-1'>
        <RichTextRenderer editorState={content} />
      </div>

      {/* Status indicators */}
      <div className='flex-shrink-0'>
        {isMatched && (
          <div className='bg-success text-success-foreground flex h-6 w-6 items-center justify-center rounded-full'>
            <Check className='h-4 w-4' />
          </div>
        )}
        {isWrong && !isMatched && (
          <div className='bg-danger text-danger-foreground flex h-6 w-6 items-center justify-center rounded-full'>
            <X className='h-4 w-4' />
          </div>
        )}
      </div>
    </button>
  );
}
