import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

interface CountdownPanelProps {
  onComplete: () => void;
}

/**
 * Panel shown during countdown phase (play_state = 'countdown')
 * - Displays animated 3...2...1...GO countdown
 * - Auto-advances to 'intro' after completion
 */
export function CountdownPanel({ onComplete }: CountdownPanelProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count === 0) {
      // Show "GO!" briefly before transitioning
      const timeout = setTimeout(() => {
        onComplete();
      }, 800);
      return () => clearTimeout(timeout);
    }

    const timer = setTimeout(() => {
      setCount(count - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className='flex min-h-[60vh] items-center justify-center overflow-hidden'>
      <AnimatePresence mode='wait'>
        {count > 0 ? (
          <motion.div
            key={count}
            className='flex flex-col items-center gap-8'
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 180, opacity: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <motion.div
              className='text-primary relative flex h-48 w-48 items-center justify-center'
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1,
                repeat: 0,
                ease: 'easeInOut',
              }}
            >
              {/* Pulsing ring */}
              <motion.div
                className='bg-primary/10 absolute inset-0 rounded-full'
                animate={{
                  scale: [1, 1.5],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: 0,
                  ease: 'easeOut',
                }}
              />

              {/* Number */}
              <span className='z-10 font-mono text-9xl font-black'>{count}</span>
            </motion.div>

            <motion.p
              className='text-muted-foreground text-sm font-medium uppercase tracking-wider'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Get Ready...
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key='go'
            className='flex flex-col items-center gap-6'
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            {/* GO! with lightning icon */}
            <motion.div
              className='flex items-center gap-4'
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.4,
                repeat: 1,
              }}
            >
              <Zap size={80} className='text-success fill-success/20' />
              <span className='text-success font-mono text-9xl font-black'>GO!</span>
              <Zap size={80} className='text-success fill-success/20' />
            </motion.div>

            {/* Multiple expanding rings */}
            {[0, 0.2, 0.4].map((delay) => (
              <motion.div
                key={delay}
                className='border-success absolute inset-0 mx-auto h-48 w-48 rounded-full border-4'
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{
                  duration: 0.8,
                  delay,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
