import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { cn } from '~/lib/utils';

interface SwipeCardProps {
  content: string;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onWrongSwipe?: (direction: 'left' | 'right') => void;
  dragEnabled?: boolean;
  cardNumber?: number;
  totalCards?: number;
  correctCategory?: 'left' | 'right';
  disabledDirection?: 'left' | 'right' | null;
}

export interface SwipeCardRef {
  swipeLeft: () => void;
  swipeRight: () => void;
  shake: () => void;
}

const SWIPE_THRESHOLD = 100;
const ROTATION_RANGE = 20;

export const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(
  (
    {
      content,
      onSwipeLeft,
      onSwipeRight,
      onWrongSwipe,
      dragEnabled = true,
      cardNumber = 1,
      totalCards = 1,
      correctCategory,
      disabledDirection = null,
    },
    ref,
  ) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 0, 200], [-ROTATION_RANGE, 0, ROTATION_RANGE]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

    // Direction indicator opacities
    const leftIndicatorOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);
    const rightIndicatorOpacity = useTransform(x, [0, 50, 150], [0, 0.5, 1]);

    const controls = useAnimation();
    const [isExiting, setIsExiting] = useState(false);

    // Reset position when card changes
    useEffect(() => {
      x.set(0);
      setIsExiting(false);
    }, [content, x]);

    const animateExit = async (direction: 'left' | 'right') => {
      if (isExiting) return;
      setIsExiting(true);

      const exitX = direction === 'right' ? 1000 : -1000;
      const exitRotate = direction === 'right' ? 30 : -30;

      await controls.start({
        x: exitX,
        rotate: exitRotate,
        opacity: 0,
        transition: {
          duration: 0.4,
          ease: [0.32, 0.72, 0, 1], // Custom easing for smooth exit
        },
      });

      // Trigger callback after animation
      if (direction === 'left') {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    };

    const animateShake = async () => {
      await controls.start({
        x: [0, -20, 20, -20, 20, -10, 10, 0],
        rotate: [0, -5, 5, -5, 5, -3, 3, 0],
        transition: {
          duration: 0.5,
          ease: 'easeInOut',
        },
      });
    };

    const handleSwipe = (direction: 'left' | 'right') => {
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
    };

    useImperativeHandle(ref, () => ({
      swipeLeft: () => handleSwipe('left'),
      swipeRight: () => handleSwipe('right'),
      shake: animateShake,
    }));

    const handleDragEnd = (_event: any, info: any) => {
      const { offset, velocity } = info;
      const swipe = Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > 500;

      if (swipe) {
        const direction = offset.x > 0 ? 'right' : 'left';
        handleSwipe(direction);
      }

      // Always reset to center if not swiping
      if (!swipe || (disabledDirection === (offset.x > 0 ? 'right' : 'left'))) {
        x.set(0);
      }
    };

    const getDragConstraints = () => {
      if (disabledDirection === 'left') {
        return { left: 0, right: 200 };
      }
      if (disabledDirection === 'right') {
        return { left: -200, right: 0 };
      }
      return { left: -200, right: 200 };
    };

    return (
      <motion.div
        className={cn(
          'bg-card border-border absolute flex h-[400px] w-full max-w-md cursor-grab select-none flex-col rounded-2xl border-2 p-6 shadow-xl active:cursor-grabbing',
          !dragEnabled && 'cursor-default active:cursor-default',
        )}
        style={{
          x,
          rotate,
          opacity,
        }}
        animate={controls}
        drag={dragEnabled && !isExiting ? 'x' : false}
        dragConstraints={getDragConstraints()}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: dragEnabled && !isExiting ? 0.98 : 1 }}
      >
        {/* Card number indicator */}
        <div className='text-muted-foreground mb-4 text-center text-sm'>
          Card {cardNumber} of {totalCards}
        </div>

        {/* Card content */}
        <div className='flex flex-1 items-center justify-center overflow-y-auto'>
          <RichTextRenderer editorState={content} />
        </div>

        {/* Direction indicators on drag */}
        {disabledDirection !== 'left' && (
          <motion.div
            className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2'
            style={{
              opacity: leftIndicatorOpacity,
            }}
          >
            <ArrowLeft className='text-destructive h-16 w-16' strokeWidth={2.5} />
          </motion.div>
        )}
        {disabledDirection !== 'right' && (
          <motion.div
            className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2'
            style={{
              opacity: rightIndicatorOpacity,
            }}
          >
            <ArrowRight className='text-success h-16 w-16' strokeWidth={2.5} />
          </motion.div>
        )}
      </motion.div>
    );
  },
);

SwipeCard.displayName = 'SwipeCard';
