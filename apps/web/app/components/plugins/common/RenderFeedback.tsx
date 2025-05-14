import { AnimatePresence, motion } from 'framer-motion';

import {
  baseFeedbackStyle,
  celebrateVariants,
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
  score?: number;
}

export function RenderFeedback({ color, icon, label, actions, score }: RenderFeedbackProps) {
  const isError = color === 'destructive';

  const variants = isError ? { ...shakeVariants, ...resetExitVariant } : feedbackVariants;

  const feedbackClassNames = cn(baseFeedbackStyle, 'px-4', {
    'bg-success/5 text-success': color === 'success',
    'bg-danger/3 text-danger': color === 'destructive',
  });

  const scoreVariants = score !== undefined ? celebrateVariants : feedbackVariants;

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={color}
        initial='initial'
        animate='animate'
        exit='exit'
        variants={variants}
        className={cn('-mx-4 -mb-4')}
      >
        <div className={feedbackClassNames}>
          <div className='flex w-full items-center justify-between'>
            <div className='flex items-center space-x-2'>
              {score ? (
                <div className='flex items-center space-x-2'>
                  {icon}
                  <p className='hidden md:flex'>{label}</p>
                </div>
              ) : null}
              {score !== undefined && (
                <motion.div
                  variants={scoreVariants}
                  className='bg-success text-success-foreground rounded-lg p-1 md:p-2'
                >
                  +{score} pts!
                </motion.div>
              )}
            </div>
            <div className='flex space-x-2'>{actions}</div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
