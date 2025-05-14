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

export const baseFeedbackStyle =
  'flex items-center justify-between px-6 py-4 font-medium rounded-b-xl';
