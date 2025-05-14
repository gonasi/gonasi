import { motion } from 'framer-motion';

interface AnimateInButtonWrapperProps {
  children: React.ReactNode;
}

export function AnimateInButtonWrapper({ children }: AnimateInButtonWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.3, ease: 'easeOut' }}
      className='relative'
    >
      {children}
    </motion.div>
  );
}
