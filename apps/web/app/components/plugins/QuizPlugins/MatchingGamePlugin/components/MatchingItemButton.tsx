import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

import type { MatchColor } from '../utils/colors';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { cn } from '~/lib/utils';

interface MatchingItemButtonProps {
  content: string;
  isSelected?: boolean;
  isMatched?: boolean;
  isDisabled?: boolean;
  isWrong?: boolean;
  matchColor?: MatchColor;
  shouldPulse?: boolean; // Pulse to indicate user should interact (right items)
  shouldPulseSubtle?: boolean; // Subtle pulse for left items when nothing selected
  shouldNudge?: boolean; // Nudge when match is made
  onClick?: () => void;
}

export function MatchingItemButton({
  content,
  isSelected = false,
  isMatched = false,
  isDisabled = false,
  isWrong = false,
  matchColor,
  shouldPulse = false,
  shouldPulseSubtle = false,
  shouldNudge = false,
  onClick,
}: MatchingItemButtonProps) {
  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick();
    }
  };

  // Determine animation state
  const getAnimateProps = () => {
    // Pulse animation when left is selected and right items should be picked
    if (shouldPulse && !isMatched && !isDisabled) {
      return {
        scale: [1, 1.03, 1],
        boxShadow: [
          '0 0 0 0 rgba(59, 130, 246, 0)',
          '0 0 0 4px rgba(59, 130, 246, 0.2)',
          '0 0 0 0 rgba(59, 130, 246, 0)',
        ],
      };
    }

    // Subtle pulse for left items when nothing is selected (guide to start)
    if (shouldPulseSubtle && !isMatched && !isDisabled && !isSelected) {
      return {
        scale: [1, 1.015, 1],
      };
    }

    // Selected left item subtle pulse
    if (isSelected && !isMatched) {
      return {
        scale: [1, 1.01, 1],
      };
    }

    return {};
  };

  const getTransitionProps = () => {
    // Pulse animation for right items
    if (shouldPulse && !isMatched && !isDisabled) {
      return {
        duration: 1.2,
        repeat: Infinity,
        repeatDelay: 0.8,
        ease: 'easeInOut' as const,
      };
    }

    // Subtle pulse for left items when nothing selected
    if (shouldPulseSubtle && !isMatched && !isDisabled && !isSelected) {
      return {
        duration: 2,
        repeat: Infinity,
        repeatDelay: 1.5,
        ease: 'easeInOut' as const,
      };
    }

    // Selected left item pulse
    if (isSelected && !isMatched) {
      return {
        duration: 0.8,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      };
    }

    return { duration: 0.3 };
  };

  return (
    <motion.button
      type='button'
      onClick={handleClick}
      disabled={isDisabled}
      // Key changes when shouldNudge changes to force animation re-trigger
      key={shouldNudge ? 'nudging' : 'idle'}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-lg border-2 p-4 text-left transition-all duration-200',
        // Base state with hover cursor
        !isMatched && !isSelected && !isDisabled && 'border-border hover:border-primary hover:bg-accent/50 hover:cursor-pointer',
        // Selected state with glow
        isSelected && !isMatched && 'border-primary bg-primary/5 shadow-primary/20 shadow-lg hover:cursor-pointer',
        // Matched state with color (only border, no background)
        isMatched && matchColor && `${matchColor.border} cursor-not-allowed`,
        // Matched state without color (fallback)
        isMatched && !matchColor && 'border-success cursor-not-allowed',
        // Disabled state (wrong attempt)
        isDisabled && !isMatched && 'border-border cursor-not-allowed opacity-50',
        // Pulsing state gets subtle highlight
        shouldPulse && !isMatched && !isDisabled && 'ring-1 ring-primary/30',
      )}
      // Initial state for nudge animation
      initial={shouldNudge ? { scale: 1, x: 0, rotate: 0 } : false}
      // Nudge animation when triggered
      animate={
        shouldNudge
          ? {
              scale: [1, 1.15, 1.15, 1],
              x: [0, -10, 10, -10, 10, 0],
              rotate: [0, -3, 3, -3, 3, 0],
            }
          : getAnimateProps()
      }
      transition={
        shouldNudge
          ? {
              duration: 0.6,
              ease: 'easeOut' as const,
              times: [0, 0.2, 0.4, 0.6, 0.8, 1],
            }
          : getTransitionProps()
      }
      whileHover={
        !isDisabled && !isMatched
          ? {
              scale: 1.02,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
            }
          : {}
      }
      whileTap={!isDisabled && !isMatched ? { scale: 0.98 } : {}}
    >
      <div className='flex-1'>
        <RichTextRenderer editorState={content} />
      </div>

      {/* Status indicators */}
      <div className='flex-shrink-0'>
        {isMatched && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full',
              matchColor ? `${matchColor.bg}` : 'bg-success',
            )}
          >
            <Check className={cn('h-5 w-5 font-bold', matchColor ? matchColor.text : 'text-white')} strokeWidth={3} />
          </motion.div>
        )}
        {isWrong && !isMatched && (
          <motion.div
            initial={{ scale: 0, rotate: 180 }}
            animate={{
              scale: 1,
              rotate: 0,
              x: [0, -2, 2, -2, 2, 0],
            }}
            transition={{
              scale: { type: 'spring', stiffness: 200, damping: 15 },
              rotate: { duration: 0.3 },
              x: { duration: 0.4, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
            }}
            className='bg-destructive text-destructive-foreground flex h-7 w-7 items-center justify-center rounded-full'
          >
            <X className='h-5 w-5' strokeWidth={3} />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}
