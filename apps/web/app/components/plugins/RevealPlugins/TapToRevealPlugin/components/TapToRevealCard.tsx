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
      className={cn('flex h-64 w-52 cursor-pointer items-center perspective-[1200px]', className)}
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
      {/* Front Side */}
      <motion.div
        data-side='front'
        className={cn(
          'bg-card border-input absolute inset-0 flex h-full w-full flex-col justify-between rounded-xl border p-3 shadow-sm backface-hidden',
          hiddenClassName,
        )}
        animate={{
          rotateY: revealed ? 180 : 0,
          opacity: revealed ? 0 : 1,
          zIndex: revealed ? 0 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 20,
        }}
        style={{
          transformStyle: 'preserve-3d',
          pointerEvents: revealed ? 'none' : 'auto',
        }}
      >
        <div className='flex justify-end'>
          <EyeOff className='text-muted-foreground h-5 w-5' />
        </div>
        <div className='flex flex-1 items-center justify-center'>{front}</div>
      </motion.div>

      {/* Back Side */}
      <motion.div
        data-side='back'
        className={cn(
          'bg-background border-input absolute inset-0 flex h-full w-full rotate-y-180 flex-col justify-between rounded-xl border p-3 shadow-md backface-hidden',
          revealedClassName,
        )}
        animate={{
          rotateY: revealed ? 360 : 180,
          opacity: revealed ? 1 : 0,
          zIndex: revealed ? 1 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 20,
        }}
        style={{
          transformStyle: 'preserve-3d',
          pointerEvents: revealed ? 'auto' : 'none',
        }}
      >
        <div className='flex justify-end'>
          <Eye className='text-foreground h-5 w-5' />
        </div>
        <div className='flex flex-1 items-center justify-center'>{back}</div>
      </motion.div>
    </div>
  );
}
