import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';

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
}

const Label = React.forwardRef<React.ComponentRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, error, required, endAdornment, endAdornmentClassName, ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants({ error }), 'flex items-center justify-between', className)}
      {...props}
    >
      <span>
        {props.children}
        {required && <span className={cn('text-foreground', { 'text-danger': error })}> *</span>}
      </span>
      {endAdornment && <span className={`ml-auto ${endAdornmentClassName}`}>{endAdornment}</span>}
    </LabelPrimitive.Root>
  ),
);

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
