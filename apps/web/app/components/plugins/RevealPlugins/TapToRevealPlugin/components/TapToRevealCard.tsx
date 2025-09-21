import type React from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '~/lib/utils';

interface TapToRevealProps {
  cardId: string;
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
  revealedClassName?: string;
  hiddenClassName?: string;
  disabledClassName?: string;
  // Hook integration props
  isRevealed: boolean;
  isEnabled: boolean;
  canReveal: boolean; // Can this card be revealed right now?
  onReveal: (cardId: string) => void;
  onToggle: (cardId: string) => void;
  // Legacy support
  disabled?: boolean;
}

export function TapToRevealCard({
  cardId,
  front,
  back,
  className,
  revealedClassName,
  hiddenClassName,
  disabledClassName,
  isRevealed,
  isEnabled,
  canReveal,
  onReveal,
  onToggle,
  disabled = false,
}: TapToRevealProps) {
  const handleClick = () => {
    if (disabled) return;

    if (!isRevealed) {
      // Card hasn't been revealed yet
      if (canReveal) {
        onReveal(cardId);
      }
    } else {
      // Card has been revealed, can toggle enabled/disabled
      onToggle(cardId);
    }
  };

  // Determine interaction state
  const canInteract = !disabled && (canReveal || isRevealed);
  const showAsRevealed = isRevealed && isEnabled;

  return (
    <div
      className={cn(
        'relative h-64 w-52 select-none',
        !canInteract ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        // Special styling for disabled revealed cards
        isRevealed && !isEnabled && 'opacity-50 grayscale',
        className,
      )}
      style={{ perspective: '1200px' }}
      onClick={canInteract ? handleClick : undefined}
      onKeyDown={
        canInteract
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      role='button'
      tabIndex={canInteract ? 0 : -1}
      aria-pressed={showAsRevealed}
      aria-disabled={!canInteract}
      aria-label={
        !isRevealed
          ? canReveal
            ? 'Tap to reveal card'
            : 'Card locked - complete previous cards first'
          : isEnabled
            ? 'Tap to disable card'
            : 'Tap to enable card'
      }
    >
      {/* Front side */}
      <motion.div
        data-side='front'
        className={cn(
          'border-input from-background to-muted/30 absolute inset-0 flex h-full w-full flex-col rounded-xl border bg-gradient-to-br p-2',
          // Apply disabled styling to front when card is revealed but disabled
          isRevealed && !isEnabled && (disabledClassName || 'opacity-75 grayscale'),
          hiddenClassName,
        )}
        animate={{
          rotateY: showAsRevealed ? 180 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 20,
        }}
        style={{
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
        }}
      >
        <EyeOff
          className={cn(
            'absolute -top-2 -right-2 h-6 w-6 rounded-full border p-1',
            !canInteract
              ? 'text-muted-foreground opacity-40'
              : isRevealed && !isEnabled
                ? 'text-muted-foreground bg-background/50 opacity-60'
                : 'text-muted-foreground bg-background/50',
          )}
        />

        <div className='flex flex-1 items-center justify-center overflow-y-auto'>{front}</div>
      </motion.div>

      {/* Back side */}
      <motion.div
        data-side='back'
        className={cn(
          'border-input from-background to-muted/20 absolute inset-0 flex h-full w-full flex-col rounded-xl border bg-gradient-to-br p-2',
          // Apply disabled styling when card is revealed but disabled
          isRevealed && !isEnabled && (disabledClassName || 'opacity-95'),
          revealedClassName,
        )}
        animate={{
          rotateY: showAsRevealed ? 360 : 180,
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 20,
        }}
        style={{
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}
      >
        <Eye
          className={cn(
            'absolute -top-2 -right-2 h-6 w-6 rounded-full border p-1',
            !canInteract
              ? 'text-muted-foreground opacity-40'
              : isRevealed && !isEnabled
                ? 'text-foreground bg-background/50 opacity-60'
                : 'text-foreground bg-background/50',
          )}
        />

        <div className='flex flex-1 items-center justify-center overflow-y-auto'>{back}</div>
      </motion.div>
    </div>
  );
}
