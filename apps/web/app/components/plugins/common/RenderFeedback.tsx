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

// Moved outside component to avoid recreation on each render
function getScoreColor(score: number): string {
  if (score >= 95) {
    return 'bg-emerald-400 dark:bg-emerald-600 text-black dark:text-white'; // brilliant emerald
  } else if (score >= 85) {
    return 'bg-green-400 dark:bg-green-600 text-black dark:text-white'; // bright green
  } else if (score >= 75) {
    return 'bg-lime-500 dark:bg-lime-700 text-black dark:text-white'; // lime green
  } else if (score >= 65) {
    return 'bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white'; // bright yellow
  } else if (score >= 55) {
    return 'bg-amber-400 dark:bg-amber-600 text-black dark:text-white'; // amber
  } else if (score >= 45) {
    return 'bg-orange-400 dark:bg-orange-600 text-black dark:text-white'; // orange
  } else if (score >= 35) {
    return 'bg-orange-600 dark:bg-orange-700 text-white'; // dark orange
  } else if (score >= 25) {
    return 'bg-red-500 dark:bg-red-600 text-white'; // red
  } else if (score > 0) {
    return 'bg-red-700 dark:bg-red-800 text-white'; // dark red
  } else {
    return 'bg-gray-500 dark:bg-gray-600 text-white'; // zero/no score
  }
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
                  className={cn('rounded-lg p-1 md:p-2', `${getScoreColor(score)}`)}
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
