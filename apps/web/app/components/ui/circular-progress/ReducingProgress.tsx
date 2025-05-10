import { useEffect, useRef, useState } from 'react';

import { CircularProgress } from './CircularProgress';

interface Props {
  time: number; // time in seconds
}

export function ReducingProgress({ time }: Props) {
  const [progress, setProgress] = useState(100);
  const start = useRef<number | null>(null);

  useEffect(() => {
    let animationFrame: number;

    const duration = time * 1000;

    const animate = (timestamp: number) => {
      if (!start.current) start.current = timestamp;
      const elapsed = timestamp - start.current;

      const newProgress = Math.max(100 - (elapsed / duration) * 100, 0);
      setProgress((prev) => (Math.abs(prev - newProgress) > 1 ? newProgress : prev));

      if (elapsed < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setProgress(0);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [time]);

  return <CircularProgress value={progress} />;
}
