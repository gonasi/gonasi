// components/ValidationSection.tsx
import type { CSSProperties } from 'react';
import { useCallback, useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
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

  // Calculate item size based on content
  const getItemSize = useCallback(
    (index: number) => {
      const field = fields[index];
      if (!field) return 0; // fallback size

      // Base size + estimated size based on content length
      const baseSize = 20;
      const nameLines = Math.ceil(field.name.length / 50); // Estimate lines for name
      const fixLines = Math.ceil(field.fix.length / 40); // Estimate lines for fix

      return baseSize + Math.max(nameLines, fixLines) * 20;
    },
    [fields],
  );

  // Calculate total height with max limit
  const listHeight = useMemo(() => {
    if (fields.length === 0) return 0;

    const totalHeight = fields.reduce((acc, _, index) => acc + getItemSize(index), 0);
    return Math.min(totalHeight, 400); // Max height of 400px
  }, [fields, getItemSize]);

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
          <List
            height={listHeight}
            itemCount={fields.length}
            itemSize={getItemSize}
            width='100%'
            itemData={fields}
          >
            {ValidationRow}
          </List>
        </motion.div>
      )}
    </div>
  );
}

// Optimized Row Renderer
interface RowProps {
  index: number;
  style: CSSProperties;
  data: ValidationField[];
}

const ValidationRow = ({ index, style, data }: RowProps) => {
  const field = data[index];
  if (!field) return null;

  return (
    <div style={style} className='bg-card/10 rounded-lg p-2'>
      <GoValidationCheckField name={field.name} fixLink={field.fix} />
    </div>
  );
};

ValidationRow.displayName = 'ValidationRow';
