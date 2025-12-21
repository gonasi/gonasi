import { motion } from 'framer-motion';

import { cn } from '~/lib/utils';

interface CategoryLabelsProps {
  leftLabel: string;
  rightLabel: string;
  dragOffset?: number;
  className?: string;
}

export function CategoryLabels({ leftLabel, rightLabel, dragOffset = 0, className }: CategoryLabelsProps) {
  const leftOpacity = dragOffset < 0 ? Math.min(1, Math.abs(dragOffset) / 100) : 0.3;
  const rightOpacity = dragOffset > 0 ? Math.min(1, Math.abs(dragOffset) / 100) : 0.3;

  return (
    <div className={cn('mb-6 flex w-full max-w-md items-center justify-between px-4', className)}>
      {/* Left Label */}
      <motion.div
        className={cn(
          'bg-destructive/10 text-destructive flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition-colors',
          dragOffset < -50 && 'bg-destructive/20',
        )}
        style={{ opacity: leftOpacity }}
        animate={{
          scale: dragOffset < -50 ? 1.1 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <span className='text-2xl'>👈</span>
        <span>{leftLabel}</span>
      </motion.div>

      {/* Right Label */}
      <motion.div
        className={cn(
          'bg-success/10 text-success flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition-colors',
          dragOffset > 50 && 'bg-success/20',
        )}
        style={{ opacity: rightOpacity }}
        animate={{
          scale: dragOffset > 50 ? 1.1 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <span>{rightLabel}</span>
        <span className='text-2xl'>👉</span>
      </motion.div>
    </div>
  );
}
