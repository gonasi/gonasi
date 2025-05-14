import { CheckCheck } from 'lucide-react';

import { useTrueOrFalseInteraction } from '../hooks/useTrueOrFalseInteraction';

import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

// Variants
const feedbackVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
};

const shakeVariants = {
  initial: { x: 0, opacity: 0 },
  animate: {
    x: [0, -10, 10, -6, 6, -3, 3, 0],
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
};

const resetExitVariant = {
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

interface Props {
  handleContinue: () => void;
  correctAnswer: 'true' | 'false';
  initialState?: any;
}

export const QuizActions = ({ handleContinue, correctAnswer, initialState }: Props) => {
  const { state, selectedOption, selectOption, hasChecked } =
    useTrueOrFalseInteraction(initialState);

  return (
    <>
      {selectedOption !== null && !hasChecked && (
        <Button
          variant='secondary'
          className={cn('rounded-full', 'mb-4')}
          rightIcon={<CheckCheck />}
        >
          Check
        </Button>
      )}
    </>
  );
};
