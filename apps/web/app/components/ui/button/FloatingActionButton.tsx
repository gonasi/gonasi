import { type ComponentProps, type ReactNode } from 'react';
import { motion } from 'framer-motion';

import { Button } from './Button';

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

interface FloatingActionButtonProps {
  onClick: () => void;
  tooltip: string;
  icon?: ReactNode;
  className?: string;
  buttonProps?: ComponentProps<typeof Button>;
}

export function FloatingActionButton({
  onClick,
  tooltip,
  icon,
  className = '',
  buttonProps,
}: FloatingActionButtonProps) {
  return (
    <motion.div
      className={`fixed right-4 bottom-20 z-50 md:right-8 md:bottom-8 lg:right-12 lg:bottom-12 ${className}`}
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
          <Button className='shadow-sm' onClick={onClick} {...buttonProps}>
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side='top'>{tooltip}</TooltipContent>
      </Tooltip>
    </motion.div>
  );
}
