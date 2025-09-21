import { motion } from 'framer-motion';

import { cn } from '~/lib/utils';

interface SlideIndicatorProps {
  current: number;
  count: number;
  className?: string;
}

export function SlideIndicator({ current, count, className }: SlideIndicatorProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-2', className)}>
      {Array.from({ length: count }, (_, i) => {
        const isActive = i + 1 === current;
        return (
          <motion.div
            key={i}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{
              scale: isActive ? 1.2 : 1,
              opacity: 1,
            }}
            transition={{ duration: 0.25 }}
            className={cn(
              'h-2 w-2 rounded-full',
              isActive ? 'bg-secondary' : 'bg-muted-foreground',
            )}
          />
        );
      })}
    </div>
  );
}
