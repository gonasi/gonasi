import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '~/lib/utils';

const baseStyles = [
  'inline-flex items-center justify-center gap-2 whitespace-nowrap group',
  'rounded-[var(--radius)] text-sm font-medium',
  'transition-all duration-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-default',
  '[&_svg]:size-4 [&_svg]:shrink-0',
  'active:scale-95 cursor-pointer font-bold',
  'relative overflow-hidden',
].join(' ');

const buttonVariants = cva(baseStyles, {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover',
      danger: 'bg-danger text-danger-foreground hover:bg-danger-hover active:bg-danger-hover',
      success: 'bg-success text-success-foreground hover:bg-success-hover active:bg-success-hover',
      warning: 'bg-warning text-warning-foreground hover:bg-warning-hover active:bg-warning-hover',
      ghost: 'text-foreground hover:bg-muted/50 active:bg-muted',
      link: 'text-secondary underline-offset-4 hover:underline hover:bg-transparent',
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

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftIconAtEdge?: boolean;
  rightIconAtEdge?: boolean;
  childrenAlign?: 'left' | 'right' | 'center';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      leftIcon,
      rightIcon,
      leftIconAtEdge = false,
      rightIconAtEdge = false,
      childrenAlign = 'center',
      isLoading,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    // Adjust padding when edge icons are present
    const edgeIconStyles = {
      paddingLeft: leftIcon && leftIconAtEdge ? '2.5rem' : undefined,
      paddingRight: rightIcon && rightIconAtEdge ? '2.5rem' : undefined,
    };

    // Get alignment classes for children
    const getChildrenAlignment = () => {
      switch (childrenAlign) {
        case 'left':
          return 'justify-start';
        case 'right':
          return 'justify-end';
        case 'center':
        default:
          return 'justify-center';
      }
    };

    // Render left icon
    const renderLeftIcon = () => {
      if (!leftIcon) return null;

      const iconContent =
        isLoading && !rightIcon ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : !isLoading ? (
          <div className='transition-transform duration-200 group-hover:scale-110'>{leftIcon}</div>
        ) : null;

      if (leftIconAtEdge) {
        return <div className='absolute top-1/2 left-3 z-10 -translate-y-1/2'>{iconContent}</div>;
      }
      return iconContent;
    };

    // Render right icon
    const renderRightIcon = () => {
      if (!rightIcon) return null;

      const iconContent = isLoading ? (
        <Loader2 className='h-4 w-4 animate-spin' />
      ) : (
        <div className='transition-transform duration-200 group-hover:scale-110'>{rightIcon}</div>
      );

      if (rightIconAtEdge) {
        return <div className='absolute top-1/2 right-3 z-10 -translate-y-1/2'>{iconContent}</div>;
      }
      return iconContent;
    };

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size }),
          (disabled || isLoading) && 'pointer-events-none cursor-not-allowed opacity-50',
          className,
        )}
        style={edgeIconStyles}
        ref={ref}
        disabled={!asChild && (disabled || isLoading)}
        {...props}
      >
        {/* Left icon when at edge */}
        {leftIconAtEdge && renderLeftIcon()}

        <span
          className={cn(
            'relative z-5 flex h-full w-full items-center gap-2',
            getChildrenAlignment(),
          )}
        >
          {/* Left icon when not at edge */}
          {!leftIconAtEdge && renderLeftIcon()}
          <div className='mt-0.5'>{children}</div>
          {/* Right icon when not at edge */}
          {!rightIconAtEdge && renderRightIcon()}
        </span>

        {/* Right icon when at edge */}
        {rightIconAtEdge && renderRightIcon()}
      </Comp>
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
