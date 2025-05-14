import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

import { Card, CardContent } from '~/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { cn } from '~/lib/utils';

interface PlayPluginWrapperProps {
  children: React.ReactNode;
  hint?: string;
  className?: string;
}

export const PlayPluginWrapper = ({ children, hint, className }: PlayPluginWrapperProps) => {
  return (
    <Card
      className={cn(
        'bg-card/40 relative -mx-4 my-6 rounded-none border-none pb-0 shadow-none md:mx-0 md:rounded-lg',
        className,
      )}
    >
      {/* Absolute top-right hint or actions */}
      <div className='absolute -top-4 right-4 z-5'>
        {hint ? (
          <Popover>
            <PopoverTrigger className='bg-card/80 cursor-pointer rounded-full p-2'>
              <motion.div
                animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                transition={{
                  duration: 0.6,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatDelay: 4,
                }}
              >
                <Lightbulb size={20} />
              </motion.div>
            </PopoverTrigger>
            <PopoverContent className='font-secondary p-2 text-sm font-light'>
              {hint}
            </PopoverContent>
          </Popover>
        ) : null}
      </div>
      <CardContent className='px-4'>{children}</CardContent>
    </Card>
  );
};
