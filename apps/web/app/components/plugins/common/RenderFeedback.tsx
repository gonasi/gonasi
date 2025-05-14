import { AnimatePresence, motion } from 'framer-motion';

import {
  baseFeedbackStyle,
  feedbackVariants,
  resetExitVariant,
  shakeVariants,
} from './animationVariants';

import { cn } from '~/lib/utils';

interface RenderFeedbackProps {
  color: 'success' | 'destructive';
  icon: React.ReactNode;
  label: string;
  actions: React.ReactNode;
}

export function RenderFeedback({ color, icon, label, actions }: RenderFeedbackProps) {
  const isError = color === 'destructive';

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={color}
        initial='initial'
        animate='animate'
        exit='exit'
        variants={isError ? { ...shakeVariants, ...resetExitVariant } : feedbackVariants}
        className={cn('-mx-4 -mb-4')}
      >
        <div
          className={cn(baseFeedbackStyle, 'px-4', {
            'bg-success/5 text-success': color === 'success',
            'bg-danger/3 text-danger': color === 'destructive',
          })}
        >
          <div className='flex w-full items-center justify-between'>
            <div className='flex items-center space-x-2'>
              {icon}
              <p>{label}</p>
            </div>
            <div className='flex space-x-2'>{actions}</div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
