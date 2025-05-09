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
      className={cn('relative h-96 w-72 cursor-pointer', className)}
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
      <motion.div
        className='relative h-full w-full'
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          data-side='front'
          className={cn(
            'bg-front border-input absolute inset-0 flex h-full w-full flex-col justify-between rounded-xl border p-3 shadow-sm backface-hidden',
            hiddenClassName,
          )}
        >
          <div className='flex justify-end'>
            <EyeOff className='text-muted-foreground h-5 w-5' />
          </div>
          <div className='flex flex-1 items-center justify-center'>{front}</div>
        </div>

        <div
          data-side='back'
          className={cn(
            'bg-back border-input absolute inset-0 flex h-full w-full rotate-y-180 flex-col justify-between rounded-xl border p-3 shadow-sm backface-hidden',
            revealedClassName,
          )}
        >
          <div className='flex justify-end'>
            <Eye className='text-foreground h-5 w-5' />
          </div>
          <div className='flex flex-1 items-center justify-center'>{back}</div>
        </div>
      </motion.div>
    </div>
  );
}
