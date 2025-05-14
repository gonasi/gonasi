import { Check, X } from 'lucide-react';

import { useTrueOrFalseInteraction } from '../hooks/useTrueOrFalseInteraction';

import { OutlineButton } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface TrueOrFalseOptionsProps {
  correctAnswer: boolean;
}

export const TrueOrFalseOptions = ({ correctAnswer }: TrueOrFalseOptionsProps) => {
  const { state, selectedOption, selectOption, checkAnswer, revealCorrectAnswer, hasChecked } =
    useTrueOrFalseInteraction();

  const getHighlightClass = ({
    isSelected,
    isCorrect,
    isWrongSelection,
  }: {
    isSelected: boolean;
    isCorrect: boolean;
    isWrongSelection: boolean;
  }) =>
    cn('w-full relative', {
      'border-secondary bg-secondary/2 text-secondary font-bold':
        isSelected && (!hasChecked || isCorrect),
      'border-danger bg-danger/5 text-danger font-bold': isWrongSelection,
      'border-success bg-success/10 text-success font-bold':
        state.canShowCorrectAnswer && isCorrect,
      'opacity-50':
        state.wrongAttempts.some((attempt) => attempt.selected === false) && !isSelected,
    });

  const renderStatusIcon = ({
    isWrongSelection,
    isCorrect,
    isSelected,
    option,
  }: {
    isWrongSelection: boolean;
    isCorrect: boolean;
    isSelected: boolean;
    option: boolean;
  }) => {
    // Check if this option was previously selected incorrectly
    const wasIncorrectAttempt = state.wrongAttempts.some((attempt) => attempt.selected === option);

    if (wasIncorrectAttempt || isWrongSelection) {
      return <X size={14} className='text-danger-foreground bg-danger rounded-full p-0.5' />;
    }

    if ((isSelected && hasChecked && isCorrect) || (state.canShowCorrectAnswer && isCorrect)) {
      return <Check size={14} className='text-success-foreground bg-success rounded-full p-0.5' />;
    }

    return null;
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-between space-x-8 py-6'>
        {([true, false] as const).map((val) => {
          const isSelected = selectedOption === val;
          const isCorrect = correctAnswer === val;
          const isWrongSelection = isSelected && hasChecked && !isCorrect;

          const disabled =
            state.wrongAttempts.some((attempt) => attempt.selected === val) ||
            (hasChecked && !state.canShowCorrectAnswer);

          const highlightClass = getHighlightClass({
            isSelected,
            isCorrect,
            isWrongSelection,
          });

          const icon = val ? <Check /> : <X />;
          const statusIcon = renderStatusIcon({
            isWrongSelection,
            isCorrect,
            isSelected,
            option: val,
          });

          return (
            <div key={String(val)} className='relative w-full'>
              <OutlineButton
                size='sm'
                className={highlightClass}
                onClick={() => selectOption(val)}
                leftIcon={icon}
                disabled={disabled || hasChecked}
              >
                {val ? 'True' : 'False'}
              </OutlineButton>

              {statusIcon && (
                <div className='absolute -top-2 -right-1.5 rounded-full'>{statusIcon}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
