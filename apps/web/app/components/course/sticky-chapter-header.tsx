import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { Play } from 'lucide-react';

export function StickyChapterHeader({ name, isActive }: { name: string; isActive: boolean }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: '-64px 0px 0px 0px' });

  const controls = useAnimation();
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!isInView && !hasAnimated) {
      controls.start({
        y: [20, 0],
        scale: [1.05, 1],
        transition: {
          duration: 0.35,
          ease: 'easeOut',
        },
      });
      setHasAnimated(true);
    }
  }, [isInView, controls, hasAnimated]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      className={`bg-background/90 sticky top-16 z-5 pt-2 pb-2 transition-colors duration-300 ${
        isActive ? 'border-primary/20 border-l-4' : 'border-l-4 border-transparent'
      }`}
    >
      <div className='flex items-center space-x-1 pl-2'>
        {isActive && <Play size={16} className='text-primary animate-pulse' />}
        <h1 className='text-foreground line-clamp-1 text-lg font-bold transition-colors duration-300 md:text-2xl'>
          {name}
        </h1>
      </div>
    </motion.div>
  );
}
