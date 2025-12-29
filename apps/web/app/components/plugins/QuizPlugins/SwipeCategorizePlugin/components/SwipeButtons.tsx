import { X, Check } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface SwipeButtonsProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  disabled?: boolean;
  disabledLeft?: boolean;
  disabledRight?: boolean;
  className?: string;
}

export function SwipeButtons({
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
  disabledLeft = false,
  disabledRight = false,
  className,
}: SwipeButtonsProps) {
  const isLeftDisabled = disabled || disabledLeft;
  const isRightDisabled = disabled || disabledRight;

  return (
    <div className={cn('mt-6 flex items-center justify-center gap-6', className)}>
      {/* Left/Reject Button */}
      <motion.div
        whileTap={{ scale: isLeftDisabled ? 1 : 0.9 }}
        whileHover={{ scale: isLeftDisabled ? 1 : 1.05 }}
      >
        <Button
          type='button'
          variant='secondary'
          size='lg'
          onClick={onSwipeLeft}
          disabled={isLeftDisabled}
          className={cn(
            'h-16 w-16 rounded-full border-2 p-0 transition-all',
            isLeftDisabled
              ? 'border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-30'
              : 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/30 hover:border-destructive/50',
          )}
        >
          <X className='h-8 w-8' />
        </Button>
      </motion.div>

      {/* Right/Accept Button */}
      <motion.div
        whileTap={{ scale: isRightDisabled ? 1 : 0.9 }}
        whileHover={{ scale: isRightDisabled ? 1 : 1.05 }}
      >
        <Button
          type='button'
          variant='secondary'
          size='lg'
          onClick={onSwipeRight}
          disabled={isRightDisabled}
          className={cn(
            'h-16 w-16 rounded-full border-2 p-0 transition-all',
            isRightDisabled
              ? 'border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-30'
              : 'bg-success/10 text-success hover:bg-success/20 border-success/30 hover:border-success/50',
          )}
        >
          <Check className='h-8 w-8' />
        </Button>
      </motion.div>
    </div>
  );
}
