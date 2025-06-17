// components/ValidationSection.tsx
import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ban, CheckCheck, LoaderCircle } from 'lucide-react';

import { GoValidationCheckField } from '~/components/ui/forms/elements';
import { cn } from '~/lib/utils';

export interface ValidationField {
  name: string;
  fix: string;
}

interface ValidationSectionProps {
  title: string;
  fields: ValidationField[];
  hasErrors: boolean;
  isLoading: boolean;
}

// Memoized icon variants to prevent recreation
const iconVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

// Memoized field item component
const ValidationFieldItem = memo(({ field, index }: { field: ValidationField; index: number }) => (
  <motion.div
    key={field.name}
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.05 * index }}
  >
    <GoValidationCheckField name={field.name} fixLink={field.fix} />
  </motion.div>
));

ValidationFieldItem.displayName = 'ValidationFieldItem';

export const ValidationSection = memo(
  ({ title, fields, hasErrors, isLoading }: ValidationSectionProps) => {
    // Memoize status icon to prevent unnecessary re-renders
    const statusIcon = useMemo(() => {
      if (isLoading) {
        return (
          <motion.div variants={iconVariants} initial='hidden' animate='visible' key='loading'>
            <LoaderCircle size={18} className='animate-spin' />
          </motion.div>
        );
      }

      if (hasErrors) {
        return (
          <motion.div variants={iconVariants} initial='hidden' animate='visible' key='error'>
            <Ban size={18} />
          </motion.div>
        );
      }

      return (
        <motion.div variants={iconVariants} initial='hidden' animate='visible' key='success'>
          <CheckCheck size={18} />
        </motion.div>
      );
    }, [isLoading, hasErrors]);

    // Memoize className computation
    const titleClassName = useMemo(
      () =>
        cn(
          'flex items-center space-x-2',
          !isLoading && hasErrors && 'text-danger',
          !isLoading && !hasErrors && 'text-success',
        ),
      [isLoading, hasErrors],
    );

    // Memoize field list to prevent unnecessary re-renders
    const fieldList = useMemo(
      () =>
        fields.map((field, index) => (
          <ValidationFieldItem key={field.name} field={field} index={index} />
        )),
      [fields],
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
          <motion.div layout className={titleClassName}>
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
              <div className='flex flex-col'>{fieldList}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  },
);

ValidationSection.displayName = 'ValidationSection';
