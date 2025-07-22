import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { cn } from '~/lib/utils';

interface Segment {
  id: string;
  weight: number;
  is_complete: boolean;
}

interface SegmentedProgressProps {
  segments: Segment[];
  className?: string;
  height?: string;
  activeBlockId?: string;
}

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

export const SegmentedProgress: React.FC<SegmentedProgressProps> = ({
  segments,
  className,
  height = 'h-2',
  activeBlockId,
}) => {
  const [mounted, setMounted] = useState(false);
  const [animatedSegments, setAnimatedSegments] = useState<Set<number>>(new Set());
  const prevSegments = usePrevious(segments);
  const animationTimeouts = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // Clear timeouts on unmount
  useEffect(() => {
    const timeouts = animationTimeouts.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  // Animate completed segments one-by-one on mount
  useEffect(() => {
    const completedIndices = segments
      .map((s, i) => (s.is_complete ? i : null))
      .filter((i): i is number => i !== null);

    const totalAnimationTime = 50; // ms
    const delayPerSegment = Math.min(150, totalAnimationTime / (completedIndices.length || 1));

    completedIndices.forEach((i, idx) => {
      const delay = idx * delayPerSegment;
      const timeoutId = setTimeout(() => {
        setAnimatedSegments((prev) => new Set([...prev, i]));
      }, delay);

      animationTimeouts.current.set(i, timeoutId);
    });

    // Set mounted after all initial animations
    const finalTimeout = setTimeout(
      () => {
        setMounted(true);
      },
      completedIndices.length * delayPerSegment + 300,
    );

    return () => {
      clearTimeout(finalTimeout);
    };
  }, [segments]);

  // Animate newly completed segments after mount
  useEffect(() => {
    if (!mounted || !prevSegments) return;

    segments.forEach((seg, i) => {
      const wasComplete = prevSegments[i]?.is_complete;
      if (seg.is_complete && !wasComplete) {
        setAnimatedSegments((prev) => new Set([...prev, i]));
      }
    });
  }, [segments, prevSegments, mounted]);

  return (
    <div className={cn('flex w-full overflow-hidden', className)}>
      {segments.map((segment, index) => {
        const isFirst = index === 0;
        const isLast = index === segments.length - 1;
        const isOnly = segments.length === 1;
        const isAnimated = animatedSegments.has(index);

        return (
          <div
            key={segment.id}
            style={{ flexGrow: segment.weight }}
            className={cn(
              'relative overflow-hidden',
              height,
              'bg-muted/40',
              isOnly ? 'rounded-full' : isFirst ? 'rounded-l-full' : isLast ? 'rounded-r-full' : '',
              !isFirst && 'ml-0.5 md:ml-1',
              activeBlockId === segment.id && 'bg-muted-foreground/20 animate-pulse',
            )}
          >
            {/* Animated overlay */}
            <motion.div
              initial={false}
              animate={{
                scaleX: segment.is_complete && isAnimated ? 1 : 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                mass: 0.5,
              }}
              style={{
                transformOrigin: 'left',
              }}
              className={cn(
                'bg-primary absolute inset-0',
                isOnly
                  ? 'rounded-full'
                  : isFirst
                    ? 'rounded-l-full'
                    : isLast
                      ? 'rounded-r-full'
                      : '',
              )}
            />
          </div>
        );
      })}
    </div>
  );
};
