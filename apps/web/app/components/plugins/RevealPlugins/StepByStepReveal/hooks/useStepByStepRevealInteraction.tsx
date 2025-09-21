import { useCallback, useMemo, useState } from 'react';

import {
  type StepByStepRevealCardSchemaTypes,
  StepByStepRevealInteractionSchema,
  type StepByStepRevealInteractionSchemaTypes,
} from '@gonasi/schemas/plugins';

const schema = StepByStepRevealInteractionSchema;

const getTimestamp = () => Date.now();

/**
 * Hook for managing step-by-step card reveals with toggle functionality
 *
 * Flow:
 * 1. Cards can only be revealed in sequential order (0, 1, 2, ...)
 * 2. Once a card is revealed for the first time, it can be toggled enabled/disabled
 * 3. Disabled cards are still "revealed" but appear inactive/grayed out
 * 4. The next card in sequence can always be revealed regardless of toggle states
 */
export function useStepByStepRevealInteraction(
  initial: StepByStepRevealInteractionSchemaTypes | null,
  cards: StepByStepRevealCardSchemaTypes[],
) {
  const defaultState: StepByStepRevealInteractionSchemaTypes = schema.parse({
    plugin_type: 'step_by_step_reveal',
  });

  // Persistent state - tracks which cards have been revealed (ever)
  const [state, setState] = useState<StepByStepRevealInteractionSchemaTypes>(() =>
    schema.parse(initial ?? { plugin_type: 'step_by_step_reveal' }),
  );

  // Toggle state - tracks enabled/disabled for revealed cards
  // true = enabled (default when first revealed), false = disabled
  const [enabledState, setEnabledState] = useState<Record<string, boolean>>(() => {
    const initialEnabledState: Record<string, boolean> = {};
    if (initial?.revealedCards) {
      initial.revealedCards.forEach((card) => {
        initialEnabledState[card.id] = true; // All revealed cards start enabled
      });
    }
    return initialEnabledState;
  });

  // Set of all card IDs that have been revealed at least once
  const revealedCardIds = useMemo(
    () => new Set(state.revealedCards.map((card) => card.id)),
    [state.revealedCards],
  );

  // True when all cards have been revealed (regardless of enabled/disabled state)
  const isCompleted = useMemo(() => {
    return state.revealedCards.length === cards.length;
  }, [cards.length, state.revealedCards.length]);

  // Index of the next card to be revealed (0-based)
  const currentCardIndex = useMemo(() => {
    return state.revealedCards.length;
  }, [state.revealedCards.length]);

  // The next card that can be revealed (null if all revealed)
  const currentCard = useMemo(() => {
    return cards[currentCardIndex] ?? null;
  }, [cards, currentCardIndex]);

  // The card that would come after the current card (for lookahead)
  const nextCard = useMemo(() => {
    return cards[currentCardIndex + 1] ?? null;
  }, [cards, currentCardIndex]);

  // The most recently revealed card (null if none revealed)
  const previousCard = useMemo(() => {
    if (currentCardIndex === 0) return null;
    return cards[currentCardIndex - 1] ?? null;
  }, [cards, currentCardIndex]);

  // Progress statistics
  const progress = useMemo(
    () => ({
      current: state.revealedCards.length,
      total: cards.length,
      percentage: cards.length > 0 ? (state.revealedCards.length / cards.length) * 100 : 0,
    }),
    [state.revealedCards.length, cards.length],
  );

  /**
   * Reveals a card for the first time (must be next in sequence)
   * Card will be enabled by default when first revealed
   */
  const revealCard = useCallback(
    (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (card && !revealedCardIds.has(cardId)) {
        setState((prev) =>
          schema.parse({
            ...prev,
            revealedCards: [
              ...prev.revealedCards,
              {
                id: cardId,
                timestamp: getTimestamp(),
              },
            ],
          }),
        );

        // New cards start enabled
        setEnabledState((prev) => ({
          ...prev,
          [cardId]: true,
        }));
      }
    },
    [cards, revealedCardIds],
  );

  /**
   * Convenience method to reveal the next card in sequence
   */
  const revealNext = useCallback(() => {
    if (currentCard) {
      revealCard(currentCard.id);
    }
  }, [currentCard, revealCard]);

  /**
   * Toggles the enabled/disabled state of a revealed card
   * Only works on cards that have been revealed at least once
   */
  const toggleCard = useCallback(
    (cardId: string) => {
      if (revealedCardIds.has(cardId)) {
        setEnabledState((prev) => ({
          ...prev,
          [cardId]: !prev[cardId],
        }));
      }
    },
    [revealedCardIds],
  );

  /**
   * Enables a revealed card (makes it active)
   */
  const enableCard = useCallback(
    (cardId: string) => {
      if (revealedCardIds.has(cardId)) {
        setEnabledState((prev) => ({
          ...prev,
          [cardId]: true,
        }));
      }
    },
    [revealedCardIds],
  );

  /**
   * Disables a revealed card (makes it inactive/grayed)
   */
  const disableCard = useCallback(
    (cardId: string) => {
      if (revealedCardIds.has(cardId)) {
        setEnabledState((prev) => ({
          ...prev,
          [cardId]: false,
        }));
      }
    },
    [revealedCardIds],
  );

  /**
   * Resets everything to initial state
   */
  const reset = useCallback(() => {
    setState(defaultState);
    setEnabledState({});
  }, [defaultState]);

  // ===== CARD STATE HELPERS =====

  /**
   * Checks if a card has been revealed at least once
   */
  const isCardRevealed = useCallback(
    (cardId: string) => {
      return revealedCardIds.has(cardId);
    },
    [revealedCardIds],
  );

  /**
   * Checks if a revealed card is currently enabled (active)
   * Returns false for unrevealed cards
   */
  const isCardEnabled = useCallback(
    (cardId: string) => {
      return revealedCardIds.has(cardId) && (enabledState[cardId] ?? true);
    },
    [revealedCardIds, enabledState],
  );

  /**
   * Checks if a revealed card is currently disabled (inactive)
   * Returns false for unrevealed cards
   */
  const isCardDisabled = useCallback(
    (cardId: string) => {
      return revealedCardIds.has(cardId) && !(enabledState[cardId] ?? true);
    },
    [revealedCardIds, enabledState],
  );

  /**
   * Gets the timestamp when a card was first revealed
   */
  const getCardRevealTime = useCallback(
    (cardId: string) => {
      return state.revealedCards.find((card) => card.id === cardId)?.timestamp ?? null;
    },
    [state.revealedCards],
  );

  /**
   * Gets all revealed cards with their enabled/disabled state
   */
  const getRevealedCards = useCallback(() => {
    return state.revealedCards
      .map((revealedCard) => ({
        ...revealedCard,
        card: cards.find((card) => card.id === revealedCard.id),
      }))
      .filter((item) => item.card)
      .map((item) => ({
        ...item.card!,
        timestamp: item.timestamp,
        isEnabled: enabledState[item.card!.id] ?? true,
        isDisabled: !(enabledState[item.card!.id] ?? true),
      }));
  }, [state.revealedCards, cards, enabledState]);

  /**
   * Gets only the enabled (active) revealed cards
   */
  const getEnabledCards = useCallback(() => {
    return getRevealedCards().filter((card) => card.isEnabled);
  }, [getRevealedCards]);

  /**
   * Gets only the disabled (inactive) revealed cards
   */
  const getDisabledCards = useCallback(() => {
    return getRevealedCards().filter((card) => card.isDisabled);
  }, [getRevealedCards]);

  // True if there's a next card that can be revealed
  const canRevealNext = useMemo(() => {
    return currentCard !== null && !isCompleted;
  }, [currentCard, isCompleted]);

  // True if we've revealed at least one card
  const canGoBack = useMemo(() => {
    return currentCardIndex > 0;
  }, [currentCardIndex]);

  // Statistics about enabled/disabled cards
  const enabledStats = useMemo(() => {
    const revealed = state.revealedCards.length;
    const enabled = Object.values(enabledState).filter(Boolean).length;
    const disabled = revealed - enabled;

    return {
      revealed,
      enabled,
      disabled,
      allEnabled: revealed > 0 && enabled === revealed,
      allDisabled: revealed > 0 && disabled === revealed,
    };
  }, [state.revealedCards.length, enabledState]);

  return {
    // ===== STATE =====
    state,
    enabledState,

    // ===== DERIVED STATE =====
    isCompleted,
    currentCardIndex,
    currentCard,
    nextCard,
    previousCard,
    progress,
    revealedCardIds,
    canRevealNext,
    canGoBack,
    enabledStats,

    // ===== ACTIONS =====
    revealCard, // Reveal specific card (if next in sequence)
    revealNext, // Reveal next card in sequence
    toggleCard, // Toggle enabled/disabled state
    enableCard, // Set card to enabled
    disableCard, // Set card to disabled
    reset, // Reset to initial state

    // ===== HELPERS =====
    isCardRevealed, // Has been revealed at least once
    isCardEnabled, // Is currently enabled/active
    isCardDisabled, // Is currently disabled/inactive
    getCardRevealTime, // When was card first revealed
    getRevealedCards, // All revealed cards with state
    getEnabledCards, // Only enabled revealed cards
    getDisabledCards, // Only disabled revealed cards
  };
}

export type StepByStepRevealInteractionReturn = ReturnType<typeof useStepByStepRevealInteraction>;
