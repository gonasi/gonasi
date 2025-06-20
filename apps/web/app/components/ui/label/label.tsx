import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '~/lib/utils';

const labelVariants = cva(
  'text-sm font-secondary font-medium pb-2 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1',
  {
    variants: {
      error: {
        true: 'text-danger',
        false: '',
      },
    },
    defaultVariants: {
      error: false,
    },
  },
);

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  error?: boolean;
  required?: boolean;
  endAdornment?: React.ReactNode;
  endAdornmentClassName?: string;
  endAdornmentKey?: string | number;
}

const Label = React.forwardRef<React.ComponentRef<typeof LabelPrimitive.Root>, LabelProps>(
  (
    { className, error, required, endAdornment, endAdornmentClassName, endAdornmentKey, ...props },
    ref,
  ) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants({ error }), 'flex items-center justify-between pt-2', className)}
      {...props}
    >
      <span>
        {props.children}
        {required && <span className={cn('text-foreground', { 'text-danger': error })}> *</span>}
      </span>

      <AnimatePresence mode='wait' initial={false}>
        {endAdornment && (
          <motion.span
            key={endAdornmentKey ?? 'static'} // Use a changing key if provided
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className={cn('ml-auto', endAdornmentClassName)}
          >
            {endAdornment}
          </motion.span>
        )}
      </AnimatePresence>
    </LabelPrimitive.Root>
  ),
);

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
