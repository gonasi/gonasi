import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { Button } from './Button';

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

export function PluginButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      className='fixed right-4 bottom-4 z-50 md:right-8 md:bottom-8 lg:right-12 lg:bottom-12'
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
          <Button
            className='border-secondary-foreground border-2 shadow-lg'
            variant='secondary'
            onClick={onClick}
          >
            <Plus className='h-5 w-5' strokeWidth={4} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='top'>Add a lesson block</TooltipContent>
      </Tooltip>
    </motion.div>
  );
}
