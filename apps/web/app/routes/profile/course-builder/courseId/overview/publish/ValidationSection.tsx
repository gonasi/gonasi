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

type ValidationState = 'pending' | 'loading' | 'success' | 'error';

interface ValidationSectionProps {
  title: string;
  fields: ValidationField[];
  validationState: ValidationState;
}

// Configuration object to reduce duplication
const VALIDATION_CONFIG = {
  pending: {
    icon: Clock,
    text: 'Not validated',
    color: 'text-muted-foreground',
    variant: 'outline' as const,
    animation: 'default' as const,
    iconClass: '',
  },
  loading: {
    icon: LoaderCircle,
    text: 'Validating...',
    color: 'text-muted-foreground',
    variant: 'tip' as const,
    animation: 'default' as const,
    iconClass: 'animate-spin',
  },
  error: {
    icon: Ban,
    text: 'Failed',
    color: 'text-danger',
    variant: 'destructive' as const,
    animation: 'error' as const,
    iconClass: '',
  },
  success: {
    icon: CheckCheck,
    text: 'Passed',
    color: 'text-success',
    variant: 'success' as const,
    animation: 'success' as const,
    iconClass: '',
  },
} as const;

// Animation variants
const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const badgeVariants = {
  error: {
    x: [0, -10, 10, -6, 6, -3, 3, 0],
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
  success: {
    scale: [1, 1.2, 1.1, 1],
    y: [0, -3, 0],
    transition: { duration: 0.5, ease: 'easeOut', times: [0, 0.4, 1] },
  },
  default: {
    scale: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

// Memoized status icon component
const StatusIcon = ({ validationState }: { validationState: ValidationState }) => {
  const config = VALIDATION_CONFIG[validationState];
  const Icon = config.icon;

  return (
    <motion.div
      variants={fadeVariants}
      initial='hidden'
      animate='visible'
      transition={{ duration: 0.2 }}
      key={validationState}
    >
      <Icon size={18} className={cn(config.color, config.iconClass)} />
    </motion.div>
  );
};

export function ValidationSection({ title, fields, validationState }: ValidationSectionProps) {
  const config = useMemo(() => VALIDATION_CONFIG[validationState], [validationState]);

  // Item renderer for Virtuoso - wrapped in useCallback for performance
  const ItemRenderer = useCallback(
    (index: number) => {
      const field = fields[index];
      if (!field) return null;

      return (
        <div className='px-4 py-3'>
          <GoValidationCheckField name={field.name} fixLink={field.fix} />
        </div>
      );
    },
    [fields],
  );

  // Memoize item key function
  const computeItemKey = useCallback(
    (index: number) => `validation-${index}-${fields[index]?.name}`,
    [fields],
  );

  const showErrorFields = validationState === 'error' && fields.length > 0;
  const listHeight = Math.min(fields.length * 80, 300);

  return (
    <div className='flex flex-col'>
      <div className='flex items-center justify-between'>
        <div className={cn('flex items-center space-x-2', config.color)}>
          <StatusIcon validationState={validationState} />
          <h2 className='mt-1 text-lg font-medium'>{title}</h2>
        </div>

        <motion.div
          key={validationState}
          variants={badgeVariants}
          initial='default'
          animate={config.animation || 'default'}
          className={cn('font-secondary text-sm font-medium italic', config.color)}
        >
          <Badge variant={config.variant}>
            {validationState === 'error' ? `${config.text} (${fields.length})` : config.text}
          </Badge>
        </motion.div>
      </div>

      {showErrorFields && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className='bg-card/30 my-2 overflow-hidden'
        >
          <div className='w-full' style={{ height: `${listHeight}px` }}>
            <Virtuoso
              data={fields}
              totalCount={fields.length}
              itemContent={ItemRenderer}
              computeItemKey={computeItemKey}
              style={{ height: '100%' }}
              className='scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20'
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
