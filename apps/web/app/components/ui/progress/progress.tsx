import type * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { motion } from 'framer-motion';

import { cn } from '~/lib/utils';

function Progress({
  className,
  value = 0,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot='progress'
      className={cn('bg-secondary/20 relative h-2 w-full overflow-hidden rounded-full', className)}
      {...props}
    >
      <motion.div
        data-slot='progress-indicator'
        className='bg-secondary h-full w-full flex-1'
        initial={{ width: '0%' }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
