// components/ValidationSection.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { Ban, CheckCheck, Clock, LoaderCircle } from 'lucide-react';

import { Badge } from '~/components/ui/badge';
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
  validationState: 'pending' | 'loading' | 'success' | 'error';
}

const iconVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

export function ValidationSection({ title, fields, validationState }: ValidationSectionProps) {
  const getStatusIcon = () => {
    switch (validationState) {
      case 'pending':
        return (
          <motion.div variants={iconVariants} initial='hidden' animate='visible' key='pending'>
            <Clock size={18} className='text-muted-foreground' />
          </motion.div>
        );
      case 'loading':
        return (
          <motion.div variants={iconVariants} initial='hidden' animate='visible' key='loading'>
            <LoaderCircle size={18} className='text-muted-foreground animate-spin' />
          </motion.div>
        );
      case 'error':
        return (
          <motion.div variants={iconVariants} initial='hidden' animate='visible' key='error'>
            <Ban size={18} className='text-danger' />
          </motion.div>
        );
      case 'success':
        return (
          <motion.div variants={iconVariants} initial='hidden' animate='visible' key='success'>
            <CheckCheck size={18} className='text-success' />
          </motion.div>
        );
      default:
        return (
          <motion.div variants={iconVariants} initial='hidden' animate='visible' key='pending'>
            <Clock size={18} className='text-muted-foreground' />
          </motion.div>
        );
    }
  };

  // Animation variants
  const variants = {
    initial: { opacity: 0, y: -4 },
    animate: (state: string) => {
      switch (state) {
        case 'success':
          return {
            opacity: 1,
            scale: [0.95, 1.05, 1],
            transition: { duration: 0.4, ease: 'easeOut' },
          };
        case 'error':
          return {
            opacity: 1,
            x: [0, -6, 6, -4, 4, 0],
            transition: { duration: 0.4, ease: 'easeInOut' },
          };
        default:
          return {
            opacity: 1,
            y: 0,
            transition: { duration: 0.2 },
          };
      }
    },
    exit: { opacity: 0, y: 4, transition: { duration: 0.2 } },
  };

  const getTitleColor = () => {
    switch (validationState) {
      case 'pending':
        return 'text-muted-foreground';
      case 'loading':
        return 'text-muted-foreground';
      case 'error':
        return 'text-danger';
      case 'success':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };

  // Utility function to determine badge variant
  const getBadgeVariant = (state: string) => {
    switch (state) {
      case 'error':
        return 'destructive';
      case 'loading':
        return 'tip';
      case 'pending':
        return 'outline';
      case 'success':
        return 'success';
      default:
        return 'outline';
    }
  };

  const getStatusText = () => {
    switch (validationState) {
      case 'pending':
        return 'Not validated';
      case 'loading':
        return 'Validating...';
      case 'error':
        return 'Failed';
      case 'success':
        return 'Passed';
      default:
        return 'Not validated';
    }
  };

  return (
    <motion.div
      layout
      className='flex flex-col'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className='flex items-center justify-between'>
        <motion.div layout className={cn('flex items-center space-x-2', getTitleColor())}>
          <AnimatePresence mode='wait'>{getStatusIcon()}</AnimatePresence>
          <motion.h2
            layout
            className='mt-1 text-lg font-medium'
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {title}
          </motion.h2>
        </motion.div>

        {/* Status indicator */}
        <AnimatePresence mode='wait'>
          <motion.div
            key={validationState}
            custom={validationState}
            variants={variants}
            initial='initial'
            animate='animate'
            exit='exit'
            className={cn('font-secondary text-sm font-medium italic', getTitleColor())}
          >
            <Badge variant={getBadgeVariant(validationState)}>{getStatusText()}</Badge>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence mode='wait'>
        {validationState !== 'loading' && validationState !== 'pending' && (
          <motion.div
            key='fields'
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            layout
          >
            <div className='mt-2 flex flex-col'>
              {validationState === 'error' &&
                fields.map((field, index) => (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <GoValidationCheckField name={field.name} fixLink={field.fix} />
                  </motion.div>
                ))}

              {/* {validationState === 'success' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='text-success pl-4 text-sm'
                >
                  All validation checks passed ✓
                </motion.div>
              )} */}
            </div>
          </motion.div>
        )}

        {/* {validationState === 'pending' && (
          <motion.div
            key='pending-message'
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className='text-muted-foreground mt-2 text-sm'
          >
            Waiting to validate...
          </motion.div>
        )} */}
      </AnimatePresence>
    </motion.div>
  );
}
