/**
 * Determine the swipe direction based on offset and velocity
 * @param offset - The drag offset in pixels
 * @param velocity - The drag velocity in pixels/second
 * @returns The swipe direction or null if threshold not met
 */
export function getSwipeDirection(
  offset: { x: number; y: number },
  velocity: { x: number; y: number },
): 'left' | 'right' | null {
  const SWIPE_THRESHOLD = 100;
  const VELOCITY_THRESHOLD = 500;

  const shouldSwipeLeft = offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD;
  const shouldSwipeRight = offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD;

  if (shouldSwipeLeft) return 'left';
  if (shouldSwipeRight) return 'right';
  return null;
}

/**
 * Determine if a swipe should be triggered
 * @param offset - The drag offset in pixels
 * @param velocity - The drag velocity in pixels/second
 * @returns Whether the swipe threshold is met
 */
export function shouldSwipe(offset: { x: number; y: number }, velocity: { x: number; y: number }): boolean {
  return getSwipeDirection(offset, velocity) !== null;
}

/**
 * Calculate rotation angle based on drag offset
 * @param offset - The drag offset in pixels
 * @returns Rotation angle in degrees (-20 to 20)
 */
export function getRotation(offset: number): number {
  const ROTATION_RANGE = 20;
  const MAX_OFFSET = 200;

  const clampedOffset = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, offset));
  return (clampedOffset / MAX_OFFSET) * ROTATION_RANGE;
}

/**
 * Calculate opacity based on drag distance
 * @param offset - The drag offset in pixels
 * @returns Opacity value (0.3 to 1.0)
 */
export function getOpacity(offset: number): number {
  const MAX_OFFSET = 200;
  const MIN_OPACITY = 0.3;

  const dragDistance = Math.abs(offset);
  if (dragDistance >= MAX_OFFSET) return MIN_OPACITY;

  return 1 - ((dragDistance / MAX_OFFSET) * (1 - MIN_OPACITY));
}
