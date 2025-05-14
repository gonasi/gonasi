// Variants
export const feedbackVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
};

export const shakeVariants = {
  initial: { x: 0, opacity: 0 },
  animate: {
    x: [0, -10, 10, -6, 6, -3, 3, 0],
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
};

export const resetExitVariant = {
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

export const celebrateVariants = {
  initial: { scale: 0.9, opacity: 0, rotate: -5 },
  animate: {
    scale: 1, // More subtle scaling
    opacity: 1,
    rotate: 3, // Less rotation for a gentler effect
    transition: {
      scale: { type: 'spring', stiffness: 250, damping: 25, bounce: 0.4 },
      opacity: { duration: 0.4 },
      rotate: { type: 'spring', stiffness: 150, damping: 20 },
    },
  },
  exit: { scale: 0.5, opacity: 0, rotate: -5, transition: { duration: 0.3 } },
};

export const baseFeedbackStyle =
  'flex items-center justify-between px-6 py-4 font-medium rounded-b-xl';
