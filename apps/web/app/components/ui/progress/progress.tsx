import type * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { motion } from 'framer-motion';

import { cn } from '~/lib/utils';

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  bgClassName?: string;
}

function Progress({ className, bgClassName, value = 0, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot='progress'
      className={cn('bg-secondary/20 relative h-2 w-full overflow-hidden rounded-full', className)}
      {...props}
    >
      <motion.div
        data-slot='progress-indicator'
        className={cn('bg-secondary h-full flex-1', bgClassName)}
        initial={{ width: '0%' }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
