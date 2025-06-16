// components/ValidationSection.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { Ban, CheckCheck, LoaderCircle } from 'lucide-react';

import { GoValidationCheckField } from '~/components/ui/forms/elements';
import { cn } from '~/lib/utils';

export interface ValidationField {
  name: string;
  title: string;
  fix: string;
}

interface ValidationSectionProps {
  title: string;
  fields: ValidationField[];
  hasErrors: boolean;
  isLoading: boolean;
}

const iconVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

export function ValidationSection({ title, fields, hasErrors, isLoading }: ValidationSectionProps) {
  const statusIcon = isLoading ? (
    <motion.div variants={iconVariants} initial='hidden' animate='visible' key='loading'>
      <LoaderCircle size={18} className='animate-spin' />
    </motion.div>
  ) : hasErrors ? (
    <motion.div variants={iconVariants} initial='hidden' animate='visible' key='error'>
      <Ban size={18} />
    </motion.div>
  ) : (
    <motion.div variants={iconVariants} initial='hidden' animate='visible' key='success'>
      <CheckCheck size={18} />
    </motion.div>
  );

  return (
    <motion.div
      layout
      className='flex flex-col'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className='flex items-center justify-between'>
        <motion.div
          layout
          className={cn(
            'flex items-center space-x-2',
            !isLoading && hasErrors && 'text-danger',
            !isLoading && !hasErrors && 'text-success',
          )}
        >
          <AnimatePresence mode='wait'>{statusIcon}</AnimatePresence>
          <motion.h2
            layout
            className='mt-1 text-lg font-medium'
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {title}
          </motion.h2>
        </motion.div>
      </div>

      <AnimatePresence mode='wait'>
        {!isLoading && (
          <motion.div
            key='fields'
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            layout
          >
            <div className='flex flex-col'>
              {fields.map((field, index) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <GoValidationCheckField
                    name={field.name}
                    title={field.title}
                    fixLink={field.fix}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
