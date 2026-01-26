import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { Play } from 'lucide-react';

export function StickyChapterHeader({
  name,
  isActive,
  nudge,
}: {
  name: string;
  isActive: boolean;
  nudge: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: '-64px 0px 0px 0px' });

  const containerControls = useAnimation();
  const headingControls = useAnimation();
  const [hasAnimated, setHasAnimated] = useState(false);

  // Scroll-in animation
  useEffect(() => {
    if (!isInView && !hasAnimated) {
      containerControls.start({
        y: [20, 0],
        scale: [1.05, 1],
        transition: {
          duration: 0.35,
          ease: 'easeOut',
        },
      });
      setHasAnimated(true);
    }
  }, [isInView, containerControls, hasAnimated]);

  // nudge nudge animation
  useEffect(() => {
    if (nudge) {
      headingControls.start({
        x: [0, -4, 4, -2, 2, 0],
        scale: [1, 1.05, 1],
        transition: {
          duration: 0.6,
          ease: 'easeInOut',
        },
      });
    }
  }, [nudge, headingControls]);

  return (
    <motion.div
      ref={ref}
      animate={containerControls}
      className={`bg-background/90 sticky top-0 z-5 pt-2 pb-2 transition-colors duration-300 ${
        isActive ? 'border-primary/20 border-l-4' : 'border-l-4 border-transparent'
      }`}
    >
      <div className='flex items-center space-x-1 pl-2'>
        {isActive && <Play size={16} className='text-primary animate-pulse' />}
        <motion.h1
          animate={headingControls}
          className='text-foreground line-clamp-1 text-lg font-bold transition-colors duration-300'
        >
          {name}
        </motion.h1>
      </div>
    </motion.div>
  );
}
