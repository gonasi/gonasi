import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { cn } from '~/lib/utils';

interface SwipeCardProps {
  content: string;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onWrongSwipe?: (direction: 'left' | 'right') => void;
  dragEnabled?: boolean;
  correctCategory?: 'left' | 'right';
  disabledDirection?: 'left' | 'right' | null;
  isFront?: boolean;
  stackIndex?: number;
}

export interface SwipeCardRef {
  swipeLeft: () => void;
  swipeRight: () => void;
  shake: () => void;
}

const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;

export const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(
  (
    {
      content,
      onSwipeLeft,
      onSwipeRight,
      onWrongSwipe,
      dragEnabled = true,
      correctCategory,
      disabledDirection = null,
      isFront = true,
      stackIndex = 0,
    },
    ref,
  ) => {
    const x = useMotionValue(0);
    const controls = useAnimation();
    const [isExiting, setIsExiting] = useState(false);
    const isProcessingRef = useRef(false);

    // Optimized rotation calculation
    const staticRotateOffset = useMemo(() => {
      return isFront ? 0 : stackIndex % 2 ? 6 : -6;
    }, [isFront, stackIndex]);

    const rotateRaw = useTransform(x, [-150, 150], [-18, 18]);
    const rotate = useTransform(rotateRaw, (value) => value + staticRotateOffset);
    const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);

    // Direction indicator opacities
    const leftIndicatorOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);
    const rightIndicatorOpacity = useTransform(x, [0, 50, 150], [0, 0.5, 1]);

    // Reset position when card changes
    useEffect(() => {
      if (isFront && !isExiting) {
        x.set(0);
        isProcessingRef.current = false;
      }
    }, [content, x, isFront, isExiting]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        isProcessingRef.current = false;
      };
    }, []);

    const animateExit = useCallback(
      async (direction: 'left' | 'right') => {
        if (isExiting || !isFront || isProcessingRef.current) return;

        isProcessingRef.current = true;
        setIsExiting(true);

        const exitX = direction === 'right' ? 1000 : -1000;
        const exitRotate = direction === 'right' ? 30 : -30;

        // Trigger callback immediately for better responsiveness
        if (direction === 'left') {
          onSwipeLeft();
        } else {
          onSwipeRight();
        }

        // Then animate exit
        await controls.start({
          x: exitX,
          rotate: exitRotate,
          opacity: 0,
          scale: 0.8,
          transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          },
        });

        // Reset state after animation
        setIsExiting(false);
        isProcessingRef.current = false;
      },
      [isExiting, isFront, controls, onSwipeLeft, onSwipeRight],
    );

    const animateShake = useCallback(async () => {
      if (!isFront || isProcessingRef.current) return;

      isProcessingRef.current = true;

      await controls.start({
        x: [0, -20, 20, -20, 20, -10, 10, 0],
        rotate: [0, -5, 5, -5, 5, -3, 3, 0],
        scale: 1,
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      });

      isProcessingRef.current = false;
    }, [isFront, controls]);

    const handleSwipe = useCallback(
      (direction: 'left' | 'right') => {
        // Prevent multiple simultaneous swipes
        if (!isFront || isProcessingRef.current || isExiting) return;

        // Check if this direction is disabled
        if (disabledDirection === direction) {
          return;
        }

        // Check if wrong direction
        if (correctCategory && correctCategory !== direction) {
          animateShake();
          onWrongSwipe?.(direction);
          return;
        }

        animateExit(direction);
      },
      [
        isFront,
        isExiting,
        disabledDirection,
        correctCategory,
        animateShake,
        animateExit,
        onWrongSwipe,
      ],
    );

    useImperativeHandle(
      ref,
      () => ({
        swipeLeft: () => handleSwipe('left'),
        swipeRight: () => handleSwipe('right'),
        shake: animateShake,
      }),
      [handleSwipe, animateShake],
    );

    const handleDragEnd = useCallback(
      (_event: any, info: any) => {
        // Prevent processing if already exiting or not front card
        if (!isFront || isProcessingRef.current || isExiting) {
          x.set(0);
          return;
        }

        const { offset, velocity } = info;
        const swipe =
          Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > VELOCITY_THRESHOLD;

        if (swipe) {
          const direction = offset.x > 0 ? 'right' : 'left';
          handleSwipe(direction);
        } else {
          // Reset to center if not swiping
          x.set(0);
        }
      },
      [isFront, isExiting, handleSwipe, x],
    );

    const dragConstraints = useMemo(() => {
      if (disabledDirection === 'left') {
        return { left: 0, right: 200 };
      }
      if (disabledDirection === 'right') {
        return { left: -200, right: 0 };
      }
      return { left: -200, right: 200 };
    }, [disabledDirection]);

    return (
      <motion.div
        className={cn(
          'bg-card border-border flex h-96 w-72 origin-bottom cursor-grab flex-col rounded-lg border p-4 select-none active:cursor-grabbing',
          !dragEnabled && 'cursor-default active:cursor-default',
          !isFront && 'pointer-events-none',
        )}
        style={{
          gridRow: 1,
          gridColumn: 1,
          x: isFront ? x : 0,
          rotate: isFront ? rotate : staticRotateOffset,
          opacity: isFront ? opacity : 1,
          boxShadow: isFront
            ? '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)'
            : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          zIndex: isFront ? 50 : 10 - stackIndex,
        }}
        animate={
          isFront
            ? controls
            : {
                scale: 0.95 - stackIndex * 0.02,
              }
        }
        initial={{ scale: isFront ? 1 : 0.95 - stackIndex * 0.02 }}
        drag={dragEnabled && !isExiting && isFront ? 'x' : false}
        dragConstraints={isFront ? dragConstraints : { left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        whileTap={isFront && dragEnabled && !isExiting ? { scale: 0.98 } : undefined}
      >
        {/* Card content */}
        <div className='flex flex-1 items-center justify-center overflow-y-auto'>
          <RichTextRenderer editorState={content} />
        </div>

        {/* Direction indicators - only on front card */}
        {isFront && (
          <>
            {disabledDirection !== 'left' && (
              <motion.div
                className='pointer-events-none absolute top-1/2 left-4 -translate-y-1/2'
                style={{
                  opacity: leftIndicatorOpacity,
                }}
              >
                <ArrowLeft className='text-destructive h-16 w-16' strokeWidth={2.5} />
              </motion.div>
            )}
            {disabledDirection !== 'right' && (
              <motion.div
                className='pointer-events-none absolute top-1/2 right-4 -translate-y-1/2'
                style={{
                  opacity: rightIndicatorOpacity,
                }}
              >
                <ArrowRight className='text-success h-16 w-16' strokeWidth={2.5} />
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    );
  },
);

SwipeCard.displayName = 'SwipeCard';
