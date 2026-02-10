import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, LoaderCircle, Presentation } from 'lucide-react';

import { cn } from '~/lib/utils';

interface PlayStateButtonProps {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  showChevron?: boolean;
  showPresentationIcon?: boolean;
}

export function PlayStateButton({
  icon: Icon,
  label,
  description,
  onClick,
  disabled = false,
  isLoading = false,
  showChevron = false,
  showPresentationIcon = false,
}: PlayStateButtonProps) {
  return (
    <motion.button
      type='button'
      onClick={onClick}
      className={cn(
        'group w-full rounded-none border bg-transparent px-3 py-2',
        'text-foreground transition',
        'hover:shadow-sm',
        'hover:cursor-pointer',
        'focus:ring-border focus:ring-2 focus:outline-none',
      )}
      disabled={disabled || isLoading}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className='flex items-center gap-3'>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Icon className='shrink-0' />
        </motion.div>

        <div className='flex min-w-0 flex-1 flex-col text-left'>
          <motion.span
            className='truncate font-medium'
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            {label}
          </motion.span>
          <motion.span
            className='text-muted-foreground font-secondary truncate text-xs leading-tight'
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {description}
          </motion.span>
        </div>

        <motion.div
          className='ml-2 flex shrink-0 items-center'
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          {isLoading ? (
            <LoaderCircle className='animate-spin' />
          ) : showChevron ? (
            <motion.div
              animate={{ y: [0, 2, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <ChevronDown />
            </motion.div>
          ) : showPresentationIcon ? (
            <Presentation size={12} />
          ) : null}
        </motion.div>
      </div>
    </motion.button>
  );
}
