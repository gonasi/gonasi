import { useCallback, useState } from 'react';
import type { z } from 'zod';

import { TapToRevealSchema } from '@gonasi/schemas/plugins';

const schema = TapToRevealSchema;

type InteractionState = z.infer<typeof schema>;

const getTimestamp = () => Date.now();

/**
 * Custom hook to manage a true/false quiz interaction state.
 */
export function useTapToRevealInteraction(initial?: Partial<InteractionState>) {
  const [state, setState] = useState<InteractionState>(() =>
    schema.parse({
      ...initial,
      interactionType: 'tap_to_reveal', // this overrides any missing `interactionType`
    }),
  );

  const revealCard = useCallback((cardIndex: number) => {
    const timestamp = getTimestamp();

    setState((prev) => ({
      ...prev,
      continue: true,
      attemptsCount: 1,
      canShowContinueButton: false,
      revealedCards: [...prev.revealedCards, { index: cardIndex, timestamp }],
    }));
  }, []);

  return {
    state,
    revealCard,
  };
}

export type TrueOrFalseInteractionReturn = ReturnType<typeof useTapToRevealInteraction>;
