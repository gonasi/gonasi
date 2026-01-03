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
    <div className={cn('flex w-full items-center justify-between space-x-4', className)}>
      {/* Left Label */}
      <motion.div
        className={cn(
          'flex items-center gap-2 rounded-full px-4 py-2 font-semibold uppercase',
          dragOffset < -50 && 'text-info',
        )}
        animate={{
          scale: dragOffset < -50 ? 1.1 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <ArrowLeft className='h-5 w-5' strokeWidth={2.5} />
        <span className='mt-1 text-xs md:text-base'>{leftLabel}</span>
      </motion.div>

      {/* Right Label */}
      <motion.div
        className={cn(
          'flex items-center justify-end gap-2 rounded-full px-4 py-2 font-semibold uppercase',
          dragOffset > 50 && 'text-success',
        )}
        animate={{
          scale: dragOffset > 50 ? 1.1 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <span className='mt-1 text-right text-xs md:text-base'>{rightLabel}</span>
        <ArrowRight className='h-5 w-5' strokeWidth={2.5} />
      </motion.div>
    </div>
  );
}
