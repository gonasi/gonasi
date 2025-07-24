import { NavLink } from 'react-router';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

import { cn } from '~/lib/utils';

interface IconNavLinkProps {
  to: string;
  icon: LucideIcon;
  size?: number;
  label?: string;
  className?: string;
  hideLabelOnMobile?: boolean;
  disabled?: boolean;
  shouldPulse?: boolean;
}

export function IconNavLink({
  to,
  icon: Icon,
  size = 22,
  label,
  className,
  hideLabelOnMobile = false,
  disabled = false,
  shouldPulse = false,
}: IconNavLinkProps) {
  return (
    <NavLink
      to={disabled ? '#' : to}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {({ isPending }) => (
        <div
          className={cn(
            'relative flex flex-col items-center justify-center transition-all duration-200',
            'hover:scale-105 hover:cursor-pointer',
            disabled && 'pointer-events-none opacity-30 hover:scale-100 hover:cursor-not-allowed',
            className,
          )}
        >
          <motion.div
            animate={
              shouldPulse
                ? {
                    x: [0, -2, 2, -1, 1, 0],
                  }
                : false
            }
            transition={
              shouldPulse
                ? {
                    duration: 0.5,
                    ease: 'easeInOut',
                    repeat: Infinity,
                    repeatDelay: 6, // subtle nudge every 6s
                  }
                : {}
            }
          >
            <Icon size={size} className={cn(isPending && 'animate-pulse')} />
          </motion.div>

          {label && (
            <span
              className={cn(
                'font-secondary text-muted-foreground pt-1 text-xs',
                hideLabelOnMobile && 'hidden md:inline',
              )}
            >
              {label}
            </span>
          )}

          {isPending && !disabled && (
            <span className='bg-primary absolute top-0 right-0 h-0.5 w-0.5 animate-ping rounded-full' />
          )}
        </div>
      )}
    </NavLink>
  );
}
