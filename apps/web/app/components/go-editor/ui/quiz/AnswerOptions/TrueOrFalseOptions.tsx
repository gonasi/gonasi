import { Check, X } from 'lucide-react';

import { OutlineButton } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface TrueOrFalseOptionsProps {
  selectedAnswer: boolean | null;
  correctAnswer: boolean;
  incorrectAttempt: boolean | null;
  isAnswerChecked: boolean;
  showCorrectAnswer: boolean;
  isDisabled: boolean;
  onAnswer: (val: boolean) => void;
}

export const TrueOrFalseOptions = ({
  selectedAnswer,
  correctAnswer,
  incorrectAttempt,
  isAnswerChecked,
  showCorrectAnswer,
  isDisabled,
  onAnswer,
}: TrueOrFalseOptionsProps) => {
  const getHighlightClass = ({
    isSelected,
    isCorrect,
    isWrongSelection,
    wasIncorrectAttempt,
  }: {
    isSelected: boolean;
    isCorrect: boolean;
    isWrongSelection: boolean;
    wasIncorrectAttempt: boolean;
  }) =>
    cn('w-full relative', {
      'border-secondary bg-secondary/2 text-secondary font-bold':
        isSelected && (!isAnswerChecked || isCorrect),
      'border-danger bg-danger/5 text-danger font-bold': isWrongSelection,
      'border-success bg-success/10 text-success font-bold': showCorrectAnswer && isCorrect,
      'opacity-50': wasIncorrectAttempt && !isSelected,
    });

  const renderStatusIcon = ({
    isWrongSelection,
    wasIncorrectAttempt,
    isCorrect,
    isSelected,
  }: {
    isWrongSelection: boolean;
    wasIncorrectAttempt: boolean;
    isCorrect: boolean;
    isSelected: boolean;
  }) => {
    if (wasIncorrectAttempt || isWrongSelection) {
      return <X size={14} className='text-danger-foreground bg-danger rounded-full p-0.5' />;
    }

    if ((isSelected && isAnswerChecked && isCorrect) || (showCorrectAnswer && isCorrect)) {
      return <Check size={14} className='text-success-foreground bg-success rounded-full p-0.5' />;
    }

    return null;
  };

  return (
    <div className='flex justify-between space-x-8 py-6'>
      {([true, false] as const).map((val) => {
        const isSelected = selectedAnswer === val;
        const isCorrect = correctAnswer === val;
        const isWrongSelection = isSelected && isAnswerChecked && !isCorrect;
        const wasIncorrectAttempt = incorrectAttempt === val;

        const disabled =
          isDisabled || wasIncorrectAttempt || (isAnswerChecked && !showCorrectAnswer);

        const highlightClass = getHighlightClass({
          isSelected,
          isCorrect,
          isWrongSelection,
          wasIncorrectAttempt,
        });

        const icon = val ? <Check /> : <X />;
        const statusIcon = renderStatusIcon({
          isWrongSelection,
          wasIncorrectAttempt,
          isCorrect,
          isSelected,
        });

        return (
          <div key={String(val)} className='relative w-full'>
            <OutlineButton
              size='sm'
              className={highlightClass}
              onClick={() => onAnswer(val)}
              leftIcon={icon}
              disabled={disabled}
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
  );
};
