import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { cn } from '~/lib/utils';

interface CategoryLabelsProps {
  leftLabel: string;
  rightLabel: string;
  dragOffset?: number;
  className?: string;
}

export function CategoryLabels({
  leftLabel,
  rightLabel,
  dragOffset = 0,
  className,
}: CategoryLabelsProps) {
  return (
    <div className={cn('mb-4 flex w-full items-center justify-between space-x-4', className)}>
      {/* Left Label */}
      <motion.div
        className={cn(
          'bg-info/90 text-info-foreground flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition-colors',
          dragOffset < -50 && 'bg-info',
        )}
        animate={{
          scale: dragOffset < -50 ? 1.1 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <ArrowLeft className='h-5 w-5' strokeWidth={2.5} />
        <span className='text-xs md:text-base'>{leftLabel}</span>
      </motion.div>

      {/* Right Label */}
      <motion.div
        className={cn(
          'bg-secondary/90 text-secondary-foreground flex items-center justify-end gap-2 rounded-full px-4 py-2 font-semibold transition-colors',
          dragOffset > 50 && 'bg-secondary',
        )}
        animate={{
          scale: dragOffset > 50 ? 1.1 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <span className='text-right text-xs md:text-base'>{rightLabel}</span>
        <ArrowRight className='h-5 w-5' strokeWidth={2.5} />
      </motion.div>
    </div>
  );
}
