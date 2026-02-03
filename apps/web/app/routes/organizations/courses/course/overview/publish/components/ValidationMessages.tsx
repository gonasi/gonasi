import { Virtuoso } from 'react-virtuoso';
import { motion } from 'framer-motion';
import { Ban, CheckCircle2 } from 'lucide-react';

import type { ValidationError } from '@gonasi/database/courses/publish';

import { GoValidationStatusMessage } from './GoValidationStatusMessage';
import { ValidationProgress } from './ValidationProgress';

import { Badge } from '~/components/ui/badge';

interface IValidationMessagesProps {
  errors: ValidationError[];
  title: string;
  completionStatus: {
    total: number;
    completed: number;
    percentage: number;
  };
}

// Animation variants
const badgeVariants = {
  error: {
    x: [0, -10, 10, -6, 6, -3, 3, 0],
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
  default: {
    scale: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function ValidationMessages({ errors, title, completionStatus }: IValidationMessagesProps) {
  const hasErrors = errors.length > 0;
  const listHeight = Math.min(errors.length * 80, 300); // Cap at 300px

  return (
    <div className='flex flex-col'>
      {/* Header with icon and badge */}
      <div className='flex items-center justify-between'>
        <div
          className={
            hasErrors
              ? 'text-danger flex items-center space-x-2'
              : 'text-success flex items-center space-x-2'
          }
        >
          <motion.div
            variants={fadeVariants}
            initial='hidden'
            animate='visible'
            transition={{ duration: 0.2 }}
          >
            {hasErrors ? <Ban size={18} /> : <CheckCircle2 size={18} />}
          </motion.div>
          <h2 className='mt-1 text-lg font-medium'>{title}</h2>
        </div>

        {hasErrors && (
          <motion.div
            variants={badgeVariants}
            initial='default'
            animate='error'
            className='font-secondary text-danger text-sm font-medium italic'
          >
            <Badge variant='destructive'>Failed ({errors.length})</Badge>
          </motion.div>
        )}
      </div>

      {completionStatus?.total > 0 && (
        <div className='py-2'>
          <ValidationProgress completionStatus={completionStatus} />
        </div>
      )}

      {hasErrors && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className='bg-card/30 my-2 overflow-hidden rounded-md'
        >
          <div className='w-full' style={{ height: `${listHeight}px` }}>
            <Virtuoso
              data={errors}
              totalCount={errors.length}
              itemContent={(index) => {
                const error = errors[index];
                return (
                  <div className='px-4 py-3'>
                    {error && (
                      <GoValidationStatusMessage
                        message={error.message}
                        fixLink={error.navigation.route}
                      />
                    )}
                  </div>
                );
              }}
              computeItemKey={(index) => `validation-${index}-${errors[index]?.field}`}
              style={{ height: '100%' }}
              className='scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20'
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
