import { useEffect, useRef, useState } from 'react';

interface UseTimerProps {
  initialTime: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

/**
 * useTimer - Countdown timer hook
 *
 * Features:
 * - Countdown from initial time to 0
 * - Auto-start or manual start
 * - Pause/resume capability
 * - Callback on completion
 * - Returns time remaining and control functions
 */
export function useTimer({ initialTime, onComplete, autoStart = false }: UseTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsComplete(true);
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, onComplete]);

  const start = () => {
    if (!isComplete) {
      setIsRunning(true);
    }
  };

  const pause = () => {
    setIsRunning(false);
  };

  const reset = () => {
    setTimeRemaining(initialTime);
    setIsComplete(false);
    setIsRunning(false);
  };

  const restart = () => {
    setTimeRemaining(initialTime);
    setIsComplete(false);
    setIsRunning(true);
  };

  return {
    timeRemaining,
    isRunning,
    isComplete,
    start,
    pause,
    reset,
    restart,
  };
}
