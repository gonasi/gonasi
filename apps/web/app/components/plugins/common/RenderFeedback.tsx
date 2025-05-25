import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import {
  baseFeedbackStyle,
  celebrateVariants,
  feedbackVariants,
  resetExitVariant,
  shakeVariants,
} from './animationVariants';

import rightAnswer from '/assets/sounds/right-answer.mp3';
import wrongAnswer from '/assets/sounds/wrong-answer.mp3';
import { cn } from '~/lib/utils';
import { useStore } from '~/store';

// Create Howl instances once and reuse them
const rightHowl = new Howl({
  src: [rightAnswer],
  volume: 0.5,
  preload: true,
});

const wrongHowl = new Howl({
  src: [wrongAnswer],
  volume: 0.5,
  preload: true,
});

interface RenderFeedbackProps {
  color: 'success' | 'destructive';
  icon: React.ReactNode;
  label: string;
  actions: React.ReactNode;
  score?: number;
  hasBeenPlayed?: boolean;
}

// Memoized score color function to avoid recalculation
const getScoreColor = (score: number): string => {
  if (score >= 95) return 'bg-emerald-400 dark:bg-emerald-600 text-black dark:text-white';
  if (score >= 85) return 'bg-green-400 dark:bg-green-600 text-black dark:text-white';
  if (score >= 75) return 'bg-lime-500 dark:bg-lime-700 text-black dark:text-white';
  if (score >= 65) return 'bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white';
  if (score >= 55) return 'bg-amber-400 dark:bg-amber-600 text-black dark:text-white';
  if (score >= 45) return 'bg-orange-400 dark:bg-orange-600 text-black dark:text-white';
  if (score >= 35) return 'bg-orange-600 dark:bg-orange-700 text-white';
  if (score >= 25) return 'bg-red-500 dark:bg-red-600 text-white';
  if (score > 0) return 'bg-red-700 dark:bg-red-800 text-white';
  return 'bg-gray-500 dark:bg-gray-600 text-white';
};

export function RenderFeedback({
  color,
  icon,
  label,
  actions,
  score,
  hasBeenPlayed = false, // use to disable sound play
}: RenderFeedbackProps) {
  const { isSoundEnabled, isVibrationEnabled } = useStore();
  const isError = color === 'destructive';

  // Play sound effect and vibrate when component mounts or color changes
  useEffect(() => {
    // Only play sound if enabled and hasn't been played yet
    if (isSoundEnabled && !hasBeenPlayed) {
      const soundToPlay = isError ? wrongHowl : rightHowl;
      soundToPlay.play();
    }

    // Add vibration for incorrect answers (mobile devices) if enabled and hasn't been played yet
    if (isError && isVibrationEnabled && !hasBeenPlayed && 'vibrate' in navigator) {
      // Double vibration pattern: vibrate for 100ms, pause 50ms, vibrate 100ms
      navigator.vibrate([100, 50, 100]);
    }
  }, [isError, isSoundEnabled, isVibrationEnabled, hasBeenPlayed]);

  // Memoize variants to avoid recalculation
  const variants = useMemo(
    () => (isError ? { ...shakeVariants, ...resetExitVariant } : feedbackVariants),
    [isError],
  );

  // Memoize score variants
  const scoreVariants = useMemo(
    () => (score !== undefined ? celebrateVariants : feedbackVariants),
    [score],
  );

  // Memoize feedback class names
  const feedbackClassNames = useMemo(
    () =>
      cn(baseFeedbackStyle, 'px-4', {
        'bg-success/5 text-success': color === 'success',
        'bg-danger/3 text-danger': color === 'destructive',
      }),
    [color],
  );

  // Memoize score color class
  const scoreColorClass = useMemo(() => (score !== undefined ? getScoreColor(score) : ''), [score]);

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={color}
        initial='initial'
        animate='animate'
        exit='exit'
        variants={variants}
        className='-mx-4 -mb-4'
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
                  className={cn('rounded-lg p-1 md:p-2', scoreColorClass)}
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
