import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';

export function StickyChapterHeader({ name }: { name: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: '-64px 0px 0px 0px' }); // top-14 = 56px + buffer

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
      className='bg-background/90 sticky top-16 z-5 pt-2 pb-2'
    >
      <div className='flex items-center space-x-1'>
        <h1 className='line-clamp-1 text-lg font-bold md:text-2xl'>{name}</h1>
      </div>
    </motion.div>
  );
}
