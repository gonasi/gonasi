import type React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LockKeyhole, LockKeyholeOpen } from 'lucide-react';

interface LockToggleIconProps {
  lock: boolean;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const LockToggleIcon: React.FC<LockToggleIconProps> = ({
  lock,
  size = 12,
  strokeWidth = 1.5,
  className = '',
}) => {
  return (
    <AnimatePresence mode='wait' initial={false}>
      <motion.div
        key={lock ? 'locked' : 'unlocked'}
        initial={{ opacity: 0, y: lock ? -10 : 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: lock ? 10 : -10, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className={className}
      >
        {lock ? (
          <LockKeyhole size={size} strokeWidth={strokeWidth} />
        ) : (
          <LockKeyholeOpen size={size} strokeWidth={strokeWidth} />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
