import { useState } from 'react';
import { motion } from 'framer-motion';

import { Label } from '~/components/ui/label';
import { cn } from '~/lib/utils';

export function CourseToggle() {
  const [isPaid, setIsPaid] = useState(false);

  const toggleCourseType = () => {
    setIsPaid(!isPaid);
  };

  return (
    <div>
      <Label>Course type</Label>
      <div className='bg-card/50 flex items-center justify-center space-x-4 rounded-lg p-3'>
        <span
          className={cn(
            'text-sm font-medium transition-colors',
            !isPaid ? 'text-success' : 'text-muted-foreground',
          )}
        >
          Free
        </span>

        <motion.button
          className={cn(
            'relative flex h-8 w-14 items-center rounded-full p-1 transition-colors',
            isPaid ? 'bg-secondary' : 'bg-gray-300',
          )}
          onClick={toggleCourseType}
          role='switch'
          aria-checked={isPaid}
          aria-label={`Switch to ${isPaid ? 'free' : 'paid'} course`}
        >
          <motion.div
            className='h-6 w-6 rounded-full bg-white shadow-md'
            layout
            transition={{
              type: 'spring',
              stiffness: 700,
              damping: 30,
            }}
            style={{
              x: isPaid ? 24 : 0,
            }}
          />
        </motion.button>

        <span
          className={cn(
            'text-sm font-medium transition-colors',
            isPaid ? 'text-secondary' : 'text-muted-foreground',
          )}
        >
          Paid
        </span>
      </div>
    </div>
  );
}
