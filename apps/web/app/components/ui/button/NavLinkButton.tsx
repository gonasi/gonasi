import * as React from 'react';
import { NavLink, type NavLinkProps } from 'react-router';
import { type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import { buttonVariants } from './Button';

import { cn } from '~/lib/utils';

export interface NavLinkButtonProps
  extends Omit<NavLinkProps, 'children'>,
    VariantProps<typeof buttonVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
  showActiveIndicator?: boolean;
  animate?: 'ltr' | 'rtl';
}

const NavLinkButton = React.forwardRef<HTMLAnchorElement, NavLinkButtonProps>(
  (
    {
      className,
      variant,
      size,
      leftIcon,
      rightIcon,
      isLoading,
      children,
      showActiveIndicator = false,
      animate = 'ltr',
      ...props
    },
    ref,
  ) => {
    // Define the animation variants based on direction
    const variants = {
      initial: { opacity: 0, x: animate === 'ltr' ? -10 : 10 },
      animate: { opacity: 1, x: 0 },
    };

    return (
      <motion.div
        initial='initial'
        animate='animate'
        variants={variants}
        transition={{ delay: 0.2, duration: 0.2, ease: 'easeIn' }}
        className='relative'
      >
        <NavLink
          ref={ref}
          className={({ isActive }) =>
            cn(
              buttonVariants({ variant, size }),
              isLoading && 'pointer-events-none cursor-not-allowed opacity-50',
              isActive &&
                showActiveIndicator &&
                'ring-primary ring-offset-background ring-2 ring-offset-2',
              className,
            )
          }
          {...props}
        >
          {({ isPending }) => (
            <span className='relative z-5 flex h-full w-full items-center justify-center gap-2'>
              {/* Left icon or loader (if rightIcon doesn't exist) */}
              {!isLoading && !isPending && leftIcon && (
                <div className='transition-transform duration-200 group-hover:scale-110'>
                  {leftIcon}
                </div>
              )}

              <div className='mt-0.5 flex items-center gap-1'>{children}</div>

              {/* Right icon or loader (if both icons exist or only rightIcon exists) */}
              {isLoading || isPending ? (
                rightIcon || (leftIcon && rightIcon) ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : leftIcon ? null : (
                  <Loader2 className='h-4 w-4 animate-spin' />
                )
              ) : rightIcon ? (
                <div className='transition-transform duration-200 group-hover:scale-110'>
                  {rightIcon}
                </div>
              ) : null}
            </span>
          )}
        </NavLink>
      </motion.div>
    );
  },
);

NavLinkButton.displayName = 'NavLinkButton';

export { NavLinkButton };
