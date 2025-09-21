import type React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '~/lib/utils';

interface TapToRevealProps {
  cardId: string;
  front: React.ReactNode;
  back: React.ReactNode;

  // Hook integration props
  isRevealed: boolean;
  canReveal: boolean; // Can this card be revealed right now?
  onReveal: (cardId: string) => void;
}

export function TapToRevealCard({
  cardId,
  front,
  back,
  isRevealed,
  canReveal,
  onReveal,
}: TapToRevealProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    if (!isRevealed && !canReveal) return;

    setIsFlipped(!isFlipped);

    if (!isRevealed) {
      onReveal(cardId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const isInteractive = isRevealed || canReveal;
  const isDisabled = !isRevealed && !canReveal;

  return (
    <motion.div
      className={cn(
        'relative h-64 w-52 transition-all duration-200 select-none',
        isInteractive ? 'cursor-pointer' : 'cursor-not-allowed',
        isDisabled && 'opacity-50',
      )}
      style={{ perspective: '1200px' }}
      onClick={handleClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role='button'
      tabIndex={isInteractive ? 0 : -1}
      aria-disabled={isDisabled}
      aria-label={isFlipped ? 'Hide card back' : 'Reveal card'}
      animate={
        canReveal && !isRevealed
          ? {
              scale: [1, 1.05, 1],
              rotate: [0, -2, 2, 0],
            }
          : {}
      }
      transition={
        canReveal && !isRevealed
          ? {
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 2, // wait 2s before next nudge
              ease: 'easeInOut',
            }
          : {}
      }
    >
      {/* Front side */}
      <motion.div
        className={cn(
          'absolute inset-0 flex h-full w-full flex-col rounded-xl border p-2',
          isRevealed
            ? 'border-success/20 from-success/5 to-muted/20 bg-gradient-to-br'
            : 'border-input from-background to-muted/30 bg-gradient-to-br',
        )}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
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
            isRevealed
              ? 'border-success/30 bg-success/10 text-success/60'
              : 'border-input bg-background/80 text-muted-foreground',
            isDisabled && 'opacity-40',
          )}
        />

        <div className='flex flex-1 items-center justify-center overflow-y-auto'>{front}</div>
      </motion.div>

      {/* Back side */}
      <motion.div
        className={cn(
          'absolute inset-0 flex h-full w-full flex-col rounded-xl border p-2',
          isRevealed
            ? 'border-success/50 from-success/20 to-muted/45 bg-gradient-to-br'
            : 'border-input from-background to-muted/20 bg-gradient-to-br',
        )}
        animate={{ rotateY: isFlipped ? 360 : 180 }}
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
            isRevealed
              ? 'border-success/50 bg-success/20 text-success'
              : 'border-input bg-background/80 text-foreground',
            isDisabled && 'opacity-40',
          )}
        />

        <div className='flex flex-1 items-center justify-center overflow-y-auto'>{back}</div>
      </motion.div>
    </motion.div>
  );
}
