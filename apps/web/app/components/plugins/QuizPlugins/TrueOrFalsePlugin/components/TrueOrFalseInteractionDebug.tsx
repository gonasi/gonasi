import type { TrueOrFalseInteractionReturn } from '../hooks/useTrueOrFalseInteraction';

interface DebugProps {
  interaction: TrueOrFalseInteractionReturn;
}

/**
 * Debug utility component to visualize the full internal state
 * of the useTrueOrFalseInteraction hook.
 */
export function TrueOrFalseInteractionDebug({ interaction }: DebugProps) {
  const {
    state,
    selectedOption,
    hasChecked,
    selectOption,
    checkAnswer,
    revealCorrectAnswer,
    skip,
    reset,
  } = interaction;

  return (
    <pre>
      {JSON.stringify(
        {
          state,
          selectedOption,
          hasChecked,
          availableActions: {
            selectOption: !!selectOption,
            checkAnswer: !!checkAnswer,
            revealCorrectAnswer: !!revealCorrectAnswer,
            skip: !!skip,
            reset: !!reset,
          },
        },
        null,
        2,
      )}
    </pre>
  );
}
