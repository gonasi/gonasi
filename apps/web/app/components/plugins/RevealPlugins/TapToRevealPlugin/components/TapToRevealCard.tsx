import type React from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '~/lib/utils';

interface TapToRevealProps {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
  revealedClassName?: string;
  hiddenClassName?: string;
  revealed?: boolean;
  onToggle?: (revealed: boolean) => void;
}

export function TapToRevealCard({
  front,
  back,
  className,
  revealedClassName,
  hiddenClassName,
  revealed = false,
  onToggle,
}: TapToRevealProps) {
  const toggleReveal = () => {
    onToggle?.(!revealed);
  };

  return (
    <div
      className={cn('relative h-64 w-52 cursor-pointer', className)}
      style={{ perspective: '1200px' }}
      onClick={toggleReveal}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleReveal();
        }
      }}
      role='button'
      tabIndex={0}
      aria-pressed={revealed}
    >
      {/* Front side */}
      <motion.div
        data-side='front'
        className={cn(
          'border-input bg-card absolute inset-0 flex h-full w-full flex-col rounded-xl border p-3 shadow-sm',
          hiddenClassName,
        )}
        animate={{
          rotateY: revealed ? 180 : 0,
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
        <EyeOff className='text-muted-foreground bg-background/50 absolute -top-2 -right-2 h-6 w-6 rounded-full border p-1' />

        <div className='flex flex-1 items-center justify-center overflow-y-auto'>{front}</div>
      </motion.div>

      {/* Back side */}
      <motion.div
        data-side='back'
        className={cn(
          'border-input bg-background absolute inset-0 flex h-full w-full flex-col rounded-xl border p-3 shadow-md',
          revealedClassName,
        )}
        animate={{
          rotateY: revealed ? 360 : 180,
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
        <Eye className='text-foreground bg-background/50 absolute -top-2 -right-2 h-6 w-6 rounded-full border p-1' />

        <div className='flex flex-1 items-center justify-center overflow-y-auto'>{back}</div>
      </motion.div>
    </div>
  );
}
