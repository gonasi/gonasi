import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '~/lib/utils';

const outlineBaseStyles = [
  'inline-flex items-center justify-center gap-2 whitespace-nowrap group',
  'rounded-[var(--radius)] text-sm font-medium',
  'transition-all duration-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  'disabled:pointer-events-none disabled:opacity-50',
  '[&_svg]:size-4 [&_svg]:shrink-0',
  'active:scale-95 cursor-pointer font-bold',
  'relative overflow-hidden',
  'bg-transparent border',
].join(' ');

const outlineButtonVariants = cva(outlineBaseStyles, {
  variants: {
    variant: {
      default:
        'text-foreground border-muted-foreground transition-colors duration-300 ease-in-out hover:bg-foreground/5 hover:border-foreground',
      primary: 'text-primary border-primary hover:bg-primary/10',
      secondary: 'text-secondary border-secondary hover:bg-secondary/10',
      danger: 'text-danger border-danger hover:bg-danger/10',
      success: 'text-success border-success hover:bg-success/10',
      warning: 'text-warning border-warning hover:bg-warning/10',
    },
    size: {
      default: 'h-12 px-4 py-2',
      sm: 'h-8 rounded-[calc(var(--radius)-0.125rem)] px-3 text-xs',
      lg: 'h-14 rounded-[calc(var(--radius)+0.125rem)] px-8',
      icon: 'h-12 w-12',
      fit: 'p-0 m-0 rounded-none',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface OutlineButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof outlineButtonVariants> {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

const OutlineButton = React.forwardRef<HTMLButtonElement, OutlineButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      leftIcon,
      rightIcon,
      isLoading,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(outlineButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        <span className='relative z-5 flex h-full w-full items-center justify-center gap-2'>
          {isLoading && <Loader2 className='h-4 w-4 animate-spin' />}
          {!isLoading && leftIcon && (
            <div className='transition-transform duration-200 group-hover:scale-110'>
              {leftIcon}
            </div>
          )}
          {children}
          {!isLoading && rightIcon && (
            <div className='transition-transform duration-200 group-hover:scale-110'>
              {rightIcon}
            </div>
          )}
        </span>
      </Comp>
    );
  },
);

OutlineButton.displayName = 'OutlineButton';

export { OutlineButton, outlineButtonVariants };
