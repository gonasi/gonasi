# Swipe Categorize Plugin Implementation Plan

## Overview

Implement a new "Swipe Categorize" assessment plugin that allows learners to sort items into two categories by swiping cards left or right (mobile) or clicking buttons (desktop). Similar to Tinder's card interface, this plugin provides an engaging way to teach categorization and binary decision-making.

## User Requirements

- **Interaction Flow**:
  - Mobile: Swipe cards left or right
  - Desktop: Click left/right buttons below card
- **Categorization**: Sort items into two predefined buckets/categories
- **Progress Tracking**: Progress bar showing cards sorted
- **Scoring**: Points based on correct categorization with penalties for wrong swipes
- **Visual Feedback**: Immediate feedback on swipe direction, card animations
- **Card Stack**: Visual card stack that depletes as user swipes

## Key Architecture Decisions

### Plugin Type
`swipe_categorize`

### Data Model

**Card Schema**:
```typescript
{
  id: UUID,
  content: Lexical,  // Rich text content for the card
  correctCategory: 'left' | 'right',  // Which bucket is correct
  index: number  // For ordering/shuffling
}
```

**Category Schema**:
```typescript
{
  leftLabel: string,   // e.g., "True", "Fact", "Correct"
  rightLabel: string,  // e.g., "False", "Opinion", "Incorrect"
}
```

**Interaction State**:
```typescript
{
  currentCardIndex: number,
  leftBucket: [{ cardId, timestamp, wasCorrect }],
  rightBucket: [{ cardId, timestamp, wasCorrect }],
  wrongSwipes: [{ cardId, swipedTo, correctCategory, timestamp }],
  isCompleted: boolean
}
```

### Scoring Algorithm

- Base score: `(correctSwipes / totalCards) * 100`
- Penalty: `5 points per wrong swipe`
- Minimum: `10 points` (if at least one correct swipe)
- Perfect score: `100` (all correct, no wrong swipes)

### Animation Strategy

- **Swipe animations**: Framer Motion drag + rotate
- **Card exit**: Fly off screen in swipe direction
- **Next card**: Fade in from center
- **Button click**: Simulate swipe animation
- **Progress**: Smooth progress bar update

## Implementation Phases

### Phase 1: Schema Foundation

**1.1 Create Content Schema**
- File: `shared/gonasi-schemas/src/plugins/schemas/swipeCategorize/index.ts`
- Define: `CardSchema`, `CategorySchema`, `SwipeCategorizeContentSchema`, `SwipeCategorizeSettingsSchema`, `SwipeCategorizeSchema`
- Settings extend: `BasePluginSettingsSchema`
- Validation: 3-20 cards required
- Card content: Rich text (Lexical)
- Categories: Required left/right labels (max 20 chars each)

**1.2 Create Interaction Schema**
- File: `shared/gonasi-schemas/src/plugins/interactions/swipeCategorizeInteractionSchema.ts`
- Define: `SwipeCategorizeInteractionSchema` with all state fields
- Key fields: `currentCardIndex`, `leftBucket`, `rightBucket`, `wrongSwipes`

**1.3 Register Schemas**
- Update: `shared/gonasi-schemas/src/plugins/schemas/index.ts`
- Update: `shared/gonasi-schemas/src/plugins/interactions/index.ts`
- Update: `shared/gonasi-schemas/src/plugins/schemaMap.ts`
- Add to `BuilderSchema` and `BlockInteractionSchema` discriminated unions
- Update: `shared/gonasi-schemas/src/plugins/pluginData.ts`
- Add `swipe_categorize` to quiz plugin types

### Phase 2: UI Components

**2.1 Create Card Component**
- File: `apps/web/app/components/plugins/QuizPlugins/SwipeCategorizePlugin/components/SwipeCard.tsx`
- Features:
  - Framer Motion drag & gesture support
  - Rotate on drag (tilt effect)
  - Opacity fade on drag distance
  - Snap back if release threshold not met
  - Exit animation when swiped past threshold
- Props: `content` (Lexical), `onSwipeLeft`, `onSwipeRight`, `dragEnabled`

**2.2 Create Category Labels Component**
- File: `apps/web/app/components/plugins/QuizPlugins/SwipeCategorizePlugin/components/CategoryLabels.tsx`
- Show left/right category labels
- Highlight on card drag (show which side will be selected)
- Features: Fade in/out based on drag distance, color coding

**2.3 Create Swipe Buttons Component**
- File: `apps/web/app/components/plugins/QuizPlugins/SwipeCategorizePlugin/components/SwipeButtons.tsx`
- Desktop buttons: Left button, Right button
- Trigger swipe animations when clicked
- Icons: Thumbs down (left) / Thumbs up (right) or X / Check
- Disabled state when no cards left

**2.4 Create Card Field Component**
- File: `apps/web/app/components/ui/forms/elements/GoCardField.tsx`
- Pattern: Similar to `GoMatchingPairField`
- Features: Add/Edit/Delete cards, modal with Lexical editor
- Each card: Content + Correct category dropdown
- Validation: 3-20 cards enforced
- Export from: `apps/web/app/components/ui/forms/elements/index.ts`

### Phase 3: Business Logic

**3.1 Scoring Function**
- File: `apps/web/app/components/plugins/QuizPlugins/SwipeCategorizePlugin/utils/index.ts`
- Function: `calculateSwipeCategorizeScore(state, totalCards): number`
- Formula: `max(10, (correctSwipes / totalCards) * 100 - (wrongSwipes * 5))`

**3.2 Gesture Utilities**
- File: `apps/web/app/components/plugins/QuizPlugins/SwipeCategorizePlugin/utils/swipeUtils.ts`
- Functions:
  - `getSwipeDirection(offset, velocity): 'left' | 'right' | null`
  - `shouldSwipe(offset, velocity): boolean`
  - `getRotation(offset): number` - Calculate card tilt
  - `getOpacity(offset): number` - Calculate fade based on drag

**3.3 State Management Hook**
- File: `apps/web/app/components/plugins/QuizPlugins/SwipeCategorizePlugin/hooks/useSwipeCategorizeInteraction.tsx`
- Pattern: Follow `useMatchingGameInteraction` structure
- Initialize: Parse initial state or default schema
- Derived state:
  - `isCompleted`: All cards swiped
  - `currentCard`: Get current card from index
  - `progress`: Cards swiped / total cards
  - `score`: Calculate score
  - `canInteract`: Not completed
- Actions:
  - `swipeLeft(cardId)`: Add to left bucket, check correctness, increment index
  - `swipeRight(cardId)`: Add to right bucket, check correctness, increment index
  - `undo()`: Go back one card (optional feature)
  - `reset()`: Full state reset (preview mode only)

### Phase 4: Builder Component

**4.1 Builder Form Component**
- File: `apps/web/app/components/plugins/QuizPlugins/SwipeCategorizePlugin/BuilderSwipeCategorizePlugin.tsx`
- Setup: `useRemixForm` with `zodResolver(SwipeCategorizeSchema)`
- Fields:
  - Question (Lexical rich text)
  - Category labels (Left label, Right label - text inputs)
  - Cards (using `GoCardField`)
  - Hint (optional textarea)
- Settings popover: `BlockWeightField`, `PlaybackModeField`, `RandomizationModeField`
- Submit: Via form action

**4.2 Register Builder Component**
- File: `apps/web/app/components/plugins/PluginRenderers/BuilderPluginBlockRenderer.tsx`
- Add lazy import: `const LazyBuilderSwipeCategorizePlugin = lazy(...)`
- Add to `pluginComponentMap`: `swipe_categorize: LazyBuilderSwipeCategorizePlugin`

### Phase 5: Player Component

**5.1 View Component**
- File: `apps/web/app/components/plugins/QuizPlugins/SwipeCategorizePlugin/ViewSwipeCategorizePlugin.tsx`
- Hooks:
  - `useViewPluginCore()` for progress tracking (play mode only)
  - `useSwipeCategorizeInteraction()` for state management
- Extract: `blockWithProgress.block_progress?.interaction_data` as initial state
- Layout:
  - Question at top
  - Category labels (left/right)
  - Card stack in center
  - Swipe buttons at bottom (desktop)
  - Progress bar
  - Feedback section
- Randomization: Shuffle cards if enabled
- Card rendering:
  - Show current card from stack
  - Enable drag on mobile
  - Show remaining cards count
- Sound effects:
  - Correct swipe: Success sound
  - Wrong swipe: Error sound + vibration
- Animations:
  - Swipe exit: Card flies off screen with rotation
  - Next card: Fade in from center
  - Progress bar: Smooth fill animation
- Feedback section:
  - Progress: "X/Y cards sorted"
  - Wrong swipes count (only if > 0)
  - Continue button (visible after all cards sorted)
- useEffect: Update interaction data, score, attempts count when state changes (play mode only)

**5.2 Register View Component**
- File: `apps/web/app/components/plugins/PluginRenderers/ViewPluginTypesRenderer.tsx`
- Import: `ViewSwipeCategorizePlugin`
- Add to `viewPluginComponentMap`: `swipe_categorize: ViewSwipeCategorizePlugin`

### Phase 6: Animations & Polish

**6.1 Swipe Animations**
- Card drag constraints
- Rotation based on drag offset (-15° to +15°)
- Opacity fade (1.0 to 0.3)
- Exit animation:
  - Translate X: ±150% viewport width
  - Rotate: ±30°
  - Duration: 0.3s
- Next card entrance:
  - Scale: 0.8 → 1.0
  - Opacity: 0 → 1
  - Duration: 0.2s

**6.2 Button Click Animations**
- Simulate swipe animation when button clicked
- Same exit animation as gesture swipe
- Button press animation (scale down)

**6.3 Category Label Feedback**
- Fade in left label when dragging left
- Fade in right label when dragging right
- Color intensity based on drag distance
- Pulse animation on correct categorization

### Phase 7: Testing & Validation

**7.1 Builder Testing**
- Create swipe categorize with 3 cards (minimum)
- Create swipe categorize with 20 cards (maximum)
- Verify validation errors (< 3 cards, > 20 cards, empty content)
- Test category labels (max 20 chars)
- Test settings (playback mode, weight, randomization)

**7.2 Player Testing**
- **Mobile**:
  - Test swipe left gesture
  - Test swipe right gesture
  - Test partial swipe (snap back)
  - Test swipe threshold
- **Desktop**:
  - Test left button click
  - Test right button click
  - Test button disabled state
- **Scoring**:
  - Test perfect score (all correct, no wrong swipes)
  - Test penalties (wrong swipes reduce score)
  - Test minimum score (10 points)
- **Animations**:
  - Card exit animations smooth
  - Next card entrance smooth
  - Progress bar updates smoothly
  - Category labels respond to drag
- **Sound/Haptics**:
  - Correct swipe plays success sound
  - Wrong swipe plays error sound + vibration

**7.3 State Persistence Testing**
- Swipe some cards, refresh page, verify state restored
- Complete half the cards, refresh, verify progress saved
- Test in both preview and play modes

## Critical Files to Create/Modify

### New Files (13)
1. `shared/gonasi-schemas/src/plugins/schemas/swipeCategorize/index.ts`
2. `shared/gonasi-schemas/src/plugins/interactions/swipeCategorizeInteractionSchema.ts`
3. `apps/web/app/components/plugins/QuizPlugins/SwipeCategorizePlugin/BuilderSwipeCategorizePlugin.tsx`
4. `apps/web/app/components/plugins/QuizPlugins/SwipeCategorizePlugin/ViewSwipeCategorizePlugin.tsx`
5. `apps/web/app/components/plugins/QuizPlugins/SwipeCategorizePlugin/hooks/useSwipeCategorizeInteraction.tsx`
6. `apps/web/app/components/plugins/QuizPlugins/SwipeCategorizePlugin/utils/index.ts`
7. `apps/web/app/components/plugins/QuizPlugins/SwipeCategorizePlugin/utils/swipeUtils.ts`
8. `apps/web/app/components/plugins/QuizPlugins/SwipeCategorizePlugin/components/SwipeCard.tsx`
9. `apps/web/app/components/plugins/QuizPlugins/SwipeCategorizePlugin/components/CategoryLabels.tsx`
10. `apps/web/app/components/plugins/QuizPlugins/SwipeCategorizePlugin/components/SwipeButtons.tsx`
11. `apps/web/app/components/ui/forms/elements/GoCardField.tsx`

### Modified Files (6)
1. `shared/gonasi-schemas/src/plugins/schemas/index.ts` - Export swipe categorize schemas
2. `shared/gonasi-schemas/src/plugins/interactions/index.ts` - Export interaction schema
3. `shared/gonasi-schemas/src/plugins/schemaMap.ts` - Add to discriminated unions
4. `shared/gonasi-schemas/src/plugins/pluginData.ts` - Register in ALL_PLUGINS
5. `apps/web/app/components/ui/forms/elements/index.ts` - Export GoCardField
6. `apps/web/app/components/plugins/PluginRenderers/BuilderPluginBlockRenderer.tsx` - Add lazy import
7. `apps/web/app/components/plugins/PluginRenderers/ViewPluginTypesRenderer.tsx` - Add view component

## Key Implementation Notes

### Swipe Gesture Detection (Mobile)

```typescript
const handleDragEnd = (event, info) => {
  const { offset, velocity } = info;
  const swipeThreshold = 100; // pixels
  const velocityThreshold = 500; // pixels/second

  if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold) {
    const direction = offset.x > 0 ? 'right' : 'left';
    onSwipe(direction);
  }
};
```

### Card Stack Visual

Only render current card + next 2 cards in stack for performance:
```typescript
const visibleCards = cards.slice(currentCardIndex, currentCardIndex + 3);
// Render with z-index and scale decreasing for cards beneath
```

### Category Label Highlight

```typescript
const getDragOpacity = (offset: number, side: 'left' | 'right') => {
  const dragDistance = Math.abs(offset);
  const maxDistance = 150;
  const isCorrectSide = (offset < 0 && side === 'left') || (offset > 0 && side === 'right');

  if (!isCorrectSide) return 0.3;
  return Math.min(1, 0.3 + (dragDistance / maxDistance) * 0.7);
};
```

### Desktop Button Animation

When button clicked, trigger same swipe animation:
```typescript
const handleButtonClick = (direction: 'left' | 'right') => {
  // Trigger programmatic swipe animation
  controls.start({
    x: direction === 'left' ? -200 : 200,
    rotate: direction === 'left' ? -20 : 20,
    opacity: 0,
  });

  setTimeout(() => onSwipe(direction), 300);
};
```

### Randomization

Shuffle cards at start if randomization enabled:
```typescript
const shuffledCards = randomization === 'shuffle'
  ? shuffleArray(cards)
  : cards.sort((a, b) => a.index - b.index);
```

## Dependencies

- Phase 1 must complete before Phase 2-5 (schemas needed)
- Phase 2 must complete before Phase 4-5 (UI components needed)
- Phase 3.1-3.2 must complete before Phase 3.3 (utils needed for hook)
- Phase 3.3 must complete before Phase 5.1 (hook needed for player)
- Phase 4 independent of Phase 5 (can be done in parallel)
- Phase 6 can be done alongside Phase 5 (animations can be refined)
- Phase 7 requires all previous phases complete

## Success Criteria

- [ ] Instructors can create swipe categorize with 3-20 cards
- [ ] Learners can swipe cards left/right on mobile
- [ ] Learners can click buttons to categorize on desktop
- [ ] Wrong swipes are tracked and penalized in scoring
- [ ] Correct swipes increase score
- [ ] Progress bar shows cards completed
- [ ] Card animations are smooth and engaging
- [ ] Category labels provide visual feedback during drag
- [ ] Sound effects play on correct/wrong swipes
- [ ] Haptic feedback on wrong swipes (mobile)
- [ ] State persists across page refreshes
- [ ] Randomization shuffles cards when enabled
- [ ] All integration points registered correctly

## UX Considerations

### Mobile Experience
- Touch-friendly card size (minimum 300x400px)
- Clear swipe threshold (100px drag or fast velocity)
- Smooth 60fps animations
- Haptic feedback on wrong categorization
- Visual feedback during drag (rotation, opacity, label highlight)

### Desktop Experience
- Large, clear buttons with icons
- Keyboard shortcuts (Left arrow = left, Right arrow = right)
- Hover states on buttons
- Button click triggers same animation as swipe

### Accessibility
- Keyboard navigation support
- Screen reader announcements for category
- High contrast category labels
- Clear visual feedback for all interactions

## Technical Challenges

1. **Smooth animations**: Use Framer Motion's `useMotionValue` and `useTransform` for performance
2. **Gesture conflicts**: Prevent page scroll during card drag
3. **State synchronization**: Ensure card index updates after animation completes
4. **Card stack rendering**: Only render visible cards for performance
5. **Responsive layout**: Different layouts for mobile (swipe) vs desktop (buttons)

## Future Enhancements

- [ ] Undo last swipe (go back one card)
- [ ] Three buckets instead of two
- [ ] Custom card background colors/images
- [ ] Animated confetti on perfect score
- [ ] Card flip animation to show explanation
- [ ] Drag-and-drop reordering in builder
- [ ] Bulk import cards from CSV
