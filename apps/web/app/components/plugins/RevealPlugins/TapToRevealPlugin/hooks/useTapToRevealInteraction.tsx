import { useCallback, useMemo, useState } from 'react';
import type { z } from 'zod';

import { TapToRevealStateInteractionSchema } from '@gonasi/schemas/plugins';

const schema = TapToRevealStateInteractionSchema;

type InteractionState = z.infer<typeof schema>;

const getTimestamp = () => Date.now();

interface Card {
  uuid: string;
  frontContent: string;
  backContent: string;
}

export function useTapToRevealInteraction(
  cards: Card[],
  cardsPerSlide: number,
  initial: Partial<InteractionState>,
) {
  const validCardUuids = useMemo(() => cards.map((card) => card.uuid), [cards]);

  const [state, setState] = useState<InteractionState>(() =>
    schema.parse({
      ...initial,
      interactionType: 'tap_to_reveal',
      revealedCards: initial?.revealedCards || [],
      attemptsCount: initial?.attemptsCount || 0,
      continue: initial?.continue || false,
      canShowContinueButton: initial?.canShowContinueButton || false,
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
          attemptsCount: prev.attemptsCount + 1,
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
      // Calculate the range of cards in the current slide
      const start = currentSlideIndex * cardsPerSlide;
      const end = Math.min(start + cardsPerSlide, cards.length);

      // Get the cards in the current slide
      const slideCards = cards.slice(start, end);

      // Navigation is allowed only if all cards in the current slide have been revealed
      return slideCards.every((card) =>
        state.revealedCards.some((revealed) => revealed.uuid === card.uuid),
      );
    },
    [cards, cardsPerSlide, state.revealedCards],
  );

  const getProgress = useCallback(() => {
    return {
      revealed: state.revealedCards.length,
      total: validCardUuids.length,
      percentage: Math.round((state.revealedCards.length / validCardUuids.length) * 100),
      complete: state.revealedCards.length === validCardUuids.length,
    };
  }, [state.revealedCards.length, validCardUuids.length]);

  return {
    state,
    revealCard,
    hasInteractedWithCard,
    canNavigateNext,
    getProgress,
  };
}
