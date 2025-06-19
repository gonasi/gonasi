// components/ValidationSection.tsx
import { useCallback, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { motion } from 'framer-motion';
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

// Simplified animation variants
const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// Memoized status icon component
const StatusIcon = ({ validationState }: { validationState: string }) => {
  const iconMap = useMemo(
    () => ({
      pending: <Clock size={18} className='text-muted-foreground' />,
      loading: <LoaderCircle size={18} className='text-muted-foreground animate-spin' />,
      error: <Ban size={18} className='text-danger' />,
      success: <CheckCheck size={18} className='text-success' />,
    }),
    [],
  );

  return (
    <motion.div
      variants={fadeVariants}
      initial='hidden'
      animate='visible'
      transition={{ duration: 0.2 }}
      key={validationState}
    >
      {iconMap[validationState as keyof typeof iconMap] || iconMap.pending}
    </motion.div>
  );
};

export function ValidationSection({ title, fields, validationState }: ValidationSectionProps) {
  // Memoize style calculations
  const titleColor = useMemo(() => {
    switch (validationState) {
      case 'error':
        return 'text-danger';
      case 'success':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  }, [validationState]);

  const badgeVariant = useMemo(() => {
    switch (validationState) {
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
  }, [validationState]);

  const statusText = useMemo(() => {
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
  }, [validationState]);

  // Item renderer for Virtuoso
  const ItemRenderer = useCallback(
    (index: number) => {
      const field = fields[index];
      if (!field) return null;

      return (
        <div className='bg-card/10 mb-2 rounded-lg p-2'>
          <GoValidationCheckField name={field.name} fixLink={field.fix} />
        </div>
      );
    },
    [fields],
  );

  const showErrorFields = validationState === 'error' && fields.length > 0;

  return (
    <div className='flex flex-col'>
      <div className='flex items-center justify-between'>
        <div className={cn('flex items-center space-x-2', titleColor)}>
          <StatusIcon validationState={validationState} />
          <h2 className='mt-1 text-lg font-medium'>{title}</h2>
        </div>

        <motion.div
          key={validationState}
          variants={fadeVariants}
          initial='hidden'
          animate='visible'
          transition={{ duration: 0.2 }}
          className={cn('font-secondary text-sm font-medium italic', titleColor)}
        >
          <Badge variant={badgeVariant}>{statusText}</Badge>
        </motion.div>
      </div>

      {showErrorFields && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className='mt-2 overflow-hidden'
        >
          <div className='w-full' style={{ height: `${fields.length * 60}px` }}>
            <Virtuoso
              data={fields}
              totalCount={fields.length}
              itemContent={ItemRenderer}
              computeItemKey={(index) => `validation-${index}-${fields[index]?.name}`}
              style={{ height: '100%' }}
              className='scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20'
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
