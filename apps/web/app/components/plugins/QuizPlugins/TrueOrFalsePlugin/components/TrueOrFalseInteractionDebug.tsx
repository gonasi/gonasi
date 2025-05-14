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
    explanation,
    // methods aren't strictly needed for debug, but included for completeness
    selectOption,
    checkAnswer,
    revealCorrectAnswer,
    skip,
    reset,
    toggleExplanation,
  } = interaction;

  return (
    <pre>
      {JSON.stringify(
        {
          state,
          selectedOption,
          hasChecked,
          explanation,
          availableActions: {
            selectOption: !!selectOption,
            checkAnswer: !!checkAnswer,
            revealCorrectAnswer: !!revealCorrectAnswer,
            skip: !!skip,
            reset: !!reset,
            toggleExplanation: !!toggleExplanation,
          },
        },
        null,
        2,
      )}
    </pre>
  );
}
