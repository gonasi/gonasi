import { motion } from 'framer-motion';
import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react';

interface ValidationPendingProps {
  title: string;
  success: boolean | null;
  isLoading: boolean;
}

export function ValidationPending({ title, success, isLoading }: ValidationPendingProps) {
  const getTitleClass = () => {
    if (isLoading) return 'text-muted-foreground';
    if (success) return 'text-success';
    return 'text-danger';
  };

  const errorShake = {
    x: [0, -10, 10, -6, 6, -3, 3, 0],
    transition: { duration: 0.6, ease: 'easeInOut' },
  };

  const titleAnimation = isLoading
    ? { opacity: 1, y: 0 }
    : success
      ? { opacity: 1, scale: 1.05 }
      : { opacity: 1, ...errorShake };

  const statusIcon = () => {
    if (isLoading) {
      return (
        <motion.div
          key='loading'
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={{ opacity: 0, rotate: 90 }}
          transition={{ duration: 0.3 }}
        >
          <LoaderCircle size={22} className='text-muted-foreground animate-spin' />
        </motion.div>
      );
    }

    if (success) {
      return (
        <motion.div
          key='success'
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1.1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3 }}
        >
          <CheckCircle2 size={22} className='text-success' />
        </motion.div>
      );
    }

    return (
      <motion.div
        key='error'
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1, ...errorShake }}
        exit={{ opacity: 0, scale: 0.5 }}
      >
        <XCircle size={22} className='text-danger' />
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className='flex items-center justify-between py-4'
    >
      <motion.h2
        key={`title-${success}-${isLoading}`}
        initial={{ opacity: 0 }}
        animate={titleAnimation}
        transition={{ duration: 0.4 }}
        className={`text-lg ${getTitleClass()}`}
      >
        {title}
      </motion.h2>

      <motion.div
        key={`icon-${success}-${isLoading}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {statusIcon()}
      </motion.div>
    </motion.div>
  );
}
