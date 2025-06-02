import { type ReactNode } from 'react';
import { NavLink } from 'react-router';
import { motion } from 'framer-motion';

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';

interface FloatingActionButtonProps {
  to: string;
  tooltip: string;
  icon?: ReactNode;
  className?: string;
}

export function FloatingActionButton({
  to,
  tooltip,
  icon,
  className = '',
}: FloatingActionButtonProps) {
  return (
    <motion.div
      className={cn(
        'fixed right-4 bottom-20 z-50 md:right-8 md:bottom-8 lg:right-12 lg:bottom-12',
        className,
      )}
      animate={{ y: [0, -5, 0] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <NavLink to={to}>
            {({ isActive, isPending }) => (
              <div className='relative flex items-center justify-center'>
                {isPending && (
                  <motion.div
                    className='border-primary/80 absolute h-15 w-15 rounded-full border-2 border-b-transparent'
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  />
                )}

                <div
                  className={cn(
                    'bg-secondary hover:bg-secondary/80 text-secondary-foreground relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2',
                    isActive ? 'border-primary' : 'border-transparent',
                    isPending && 'cursor-progress',
                  )}
                >
                  {icon}
                </div>
              </div>
            )}
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side='top'>{tooltip}</TooltipContent>
      </Tooltip>
    </motion.div>
  );
}
