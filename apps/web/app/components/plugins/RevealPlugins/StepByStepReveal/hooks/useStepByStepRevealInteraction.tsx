import { useCallback, useMemo, useState } from 'react';

import {
  type StepByStepRevealCardSchemaTypes,
  StepByStepRevealInteractionSchema,
  type StepByStepRevealInteractionSchemaTypes,
} from '@gonasi/schemas/plugins';

const schema = StepByStepRevealInteractionSchema;

const getTimestamp = () => Date.now();

/**
 * Hook for managing a sequential "step-by-step reveal" card flow.
 *
 * Behavior:
 * - Cards must be revealed in order (0 → 1 → 2 → ...).
 * - A card becomes "revealed" the first time it’s shown and stays revealed thereafter.
 * - Once revealed, a card may be toggled active/inactive, but it never becomes "unrevealed".
 * - The next card in sequence can always be revealed, regardless of toggle state.
 */
export function useStepByStepRevealInteraction(
  initial: StepByStepRevealInteractionSchemaTypes | null,
  cards: StepByStepRevealCardSchemaTypes[],
) {
  const defaultState: StepByStepRevealInteractionSchemaTypes = schema.parse({
    plugin_type: 'step_by_step_reveal',
  });

  // State: validated interaction state (revealed cards with metadata)
  const [state, setState] = useState<StepByStepRevealInteractionSchemaTypes>(() =>
    schema.parse(initial ?? { plugin_type: 'step_by_step_reveal' }),
  );

  // Set of IDs for all cards revealed at least once
  const revealedCardIds = useMemo(
    () => new Set(state.revealedCards.map((card) => card.id)),
    [state.revealedCards],
  );

  // True if every card in the list has been revealed
  const isCompleted = useMemo(
    () => state.revealedCards.length === cards.length,
    [cards.length, state.revealedCards.length],
  );

  // Index of the next unrevealed card
  const currentCardIndex = useMemo(() => state.revealedCards.length, [state.revealedCards.length]);

  // The next unrevealed card (or null if all revealed)
  const currentCard = useMemo(() => cards[currentCardIndex] ?? null, [cards, currentCardIndex]);

  // Lookahead: the card after the current card (or null if none)
  const nextCard = useMemo(() => cards[currentCardIndex + 1] ?? null, [cards, currentCardIndex]);

  // The most recently revealed card (or null if none yet revealed)
  const previousCard = useMemo(
    () => (currentCardIndex > 0 ? (cards[currentCardIndex - 1] ?? null) : null),
    [cards, currentCardIndex],
  );

  // Progress stats for UI display
  const progress = useMemo(
    () => ({
      current: state.revealedCards.length,
      total: cards.length,
      percentage: cards.length > 0 ? (state.revealedCards.length / cards.length) * 100 : 0,
    }),
    [state.revealedCards.length, cards.length],
  );

  /**
   * Reveal a specific card by ID (must be the next in sequence).
   * Assigns a reveal timestamp and marks the card as revealed.
   */
  const revealCard = useCallback(
    (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (card && !revealedCardIds.has(cardId)) {
        setState((prev) =>
          schema.parse({
            ...prev,
            revealedCards: [...prev.revealedCards, { id: cardId, timestamp: getTimestamp() }],
          }),
        );
      }
    },
    [cards, revealedCardIds],
  );

  /**
   * Reveal the next unrevealed card in sequence.
   */
  const revealNext = useCallback(() => {
    if (currentCard) {
      revealCard(currentCard.id);
    }
  }, [currentCard, revealCard]);

  /**
   * Reset the interaction back to its default state.
   */
  const reset = useCallback(() => {
    setState(defaultState);
  }, [defaultState]);

  // ----- Helpers -----

  /** Check if a card has ever been revealed */
  const isCardRevealed = useCallback(
    (cardId: string) => revealedCardIds.has(cardId),
    [revealedCardIds],
  );

  /** Get the timestamp when a card was first revealed (null if never) */
  const getCardRevealTime = useCallback(
    (cardId: string) => state.revealedCards.find((card) => card.id === cardId)?.timestamp ?? null,
    [state.revealedCards],
  );

  /** Get all revealed cards with their metadata and reveal timestamps */
  const getRevealedCards = useCallback(() => {
    return state.revealedCards
      .map((revealed) => ({
        ...revealed,
        card: cards.find((c) => c.id === revealed.id),
      }))
      .filter((entry) => entry.card)
      .map((entry) => ({
        ...entry.card!,
        timestamp: entry.timestamp,
      }));
  }, [state.revealedCards, cards]);

  // Derived booleans for navigation / UI
  const canRevealNext = useMemo(
    () => currentCard !== null && !isCompleted,
    [currentCard, isCompleted],
  );

  const canGoBack = useMemo(() => currentCardIndex > 0, [currentCardIndex]);

  return {
    // State
    state,

    // Derived state
    isCompleted,
    currentCardIndex,
    currentCard,
    nextCard,
    previousCard,
    progress,
    revealedCardIds,
    canRevealNext,
    canGoBack,

    // Actions
    revealCard,
    revealNext,
    reset,

    // Helpers
    isCardRevealed,
    getCardRevealTime,
    getRevealedCards,
  };
}

export type StepByStepRevealInteractionReturn = ReturnType<typeof useStepByStepRevealInteraction>;
