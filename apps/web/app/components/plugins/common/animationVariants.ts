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
  initial: {
    scale: 0.8,
    opacity: 0,
    rotate: -15,
    x: -10,
    y: 10,
  },
  animate: {
    scale: 1,
    opacity: 1,
    x: [-10, -8, -12, -9, -10, 0], // simulate shaking along X (left)
    y: [10, 5, 12, 6, 10, 0], // simulate shaking up/down from bottom-left
    rotate: [-15, 5, -10, 5, -3, 3],
    transition: {
      x: { duration: 0.3, ease: 'easeInOut' },
      y: { duration: 0.3, ease: 'easeInOut' },
      rotate: { duration: 0.3, ease: 'easeInOut' },
      scale: { type: 'spring', stiffness: 250, damping: 25, bounce: 0.4 },
      opacity: { duration: 0.4 },
    },
  },
  exit: {
    scale: 0.5,
    opacity: 0,
    rotate: -5,
    transition: { duration: 0.3 },
  },
};

export const baseFeedbackStyle =
  'flex items-center justify-between px-6 py-4 font-medium rounded-b-xl';
