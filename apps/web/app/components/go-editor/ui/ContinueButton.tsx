import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface ContinueButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}

export function ContinueButton({ onClick, loading, disabled }: ContinueButtonProps) {
  const [isTemporarilyDisabled, setIsTemporarilyDisabled] = useState(true);
  const [progress, setProgress] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(5);
  const duration = disabled ? 0 : 5000; // 5 seconds
  const intervalTime = 50; // Update every 50ms for smooth animation

  useEffect(() => {
    if (isTemporarilyDisabled && !loading) {
      const startTime = Date.now();

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(elapsed / duration, 1);
        setProgress(newProgress);

        // Calculate seconds left (from 5 down to 0)
        const newSecondsLeft = Math.ceil(5 - newProgress * 5);
        setSecondsLeft(newSecondsLeft);

        if (elapsed >= duration) {
          setIsTemporarilyDisabled(false);
          clearInterval(interval);
        }
      }, intervalTime);

      return () => clearInterval(interval);
    }
    return undefined; // Explicitly return undefined for other cases
  }, [isTemporarilyDisabled, loading, duration]);

  const showProgress = isTemporarilyDisabled && !loading;
  const btnDisabled = isTemporarilyDisabled || loading || disabled;

  // Calculate the conic gradient for the border
  const progressDegrees = progress * 360;
  const borderBackground = showProgress
    ? `conic-gradient(#20c9d0 ${progressDegrees}deg, #e2e8f0 ${progressDegrees}deg)`
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className='relative'
    >
      <div
        className={cn(
          'relative w-32 rounded-full p-[2px]',
          showProgress ? 'bg-gradient-to-r' : 'bg-transparent',
        )}
        style={{ background: borderBackground }}
      >
        <Button
          onClick={onClick}
          disabled={btnDisabled}
          className={cn(
            'w-full rounded-full disabled:pointer-events-none',
            btnDisabled
              ? 'scale-95 blur-xs transition-all duration-300'
              : 'hover:bg-secondary/80 transition-all duration-300',
          )}
          variant='secondary'
        >
          <span className='flex items-center gap-2'>
            {showProgress ? `Continue in ${secondsLeft}` : 'Continue'}
            {!showProgress && <ArrowRight className='h-4 w-4' />}
          </span>

          {loading && (
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
            </div>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
