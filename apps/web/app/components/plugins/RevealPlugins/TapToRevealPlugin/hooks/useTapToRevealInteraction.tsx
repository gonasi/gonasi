import { useCallback, useMemo, useState } from 'react';
import type { z } from 'zod';

import { TapToRevealInteractionSchema } from '@gonasi/schemas/plugins';

const schema = TapToRevealInteractionSchema;

type InteractionState = z.infer<typeof schema>;

const getTimestamp = () => Date.now();

interface Card {
  uuid: string;
  frontContent: string;
  backContent: string;
}

export function useTapToRevealInteraction(
  cards: Card[],
  cardsPerSlide: 1 | 2,
  initial?: Partial<InteractionState>,
) {
  const validCardUuids = useMemo(() => cards.map((card) => card.uuid), [cards]);

  const [state, setState] = useState<InteractionState>(() =>
    schema.parse({
      ...initial,
      interactionType: 'tap_to_reveal',
    }),
  );

  const revealCard = useCallback(
    (cardUuid: string) => {
      const timestamp = getTimestamp();

      setState((prev) => {
        const alreadyRevealed = prev.revealedCards.some((card) => card.uuid === cardUuid);
        if (alreadyRevealed || !validCardUuids.includes(cardUuid)) return prev;

        const newRevealedCards = [...prev.revealedCards, { uuid: cardUuid, timestamp }];
        const allRevealed = validCardUuids.every((uuid) =>
          newRevealedCards.some((card) => card.uuid === uuid),
        );

        return {
          ...prev,
          continue: allRevealed,
          attemptsCount: 1,
          canShowContinueButton: allRevealed,
          revealedCards: newRevealedCards,
        };
      });
    },
    [validCardUuids],
  );

  const hasInteractedWithCard = useCallback(
    (cardUuid: string) => {
      return state.revealedCards.some((card) => card.uuid === cardUuid);
    },
    [state.revealedCards],
  );

  const canNavigateNext = useCallback(
    (currentSlideIndex: number) => {
      const start = currentSlideIndex * cardsPerSlide;
      const slideCards = cards.slice(start, start + cardsPerSlide);

      return slideCards.every((card) =>
        state.revealedCards.some((revealed) => revealed.uuid === card.uuid),
      );
    },
    [cards, cardsPerSlide, state.revealedCards],
  );

  return {
    state,
    revealCard,
    hasInteractedWithCard,
    canNavigateNext,
  };
}
