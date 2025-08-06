interface Dimensions {
  width?: number;
  height?: number;
}

interface CalculateDimensionsArgs {
  width: number | 'inherit';
  height: number | 'inherit';
  dimensions?: Dimensions | null;
  maxWidth: number;
  fallbackWidth?: number;
  fallbackHeight?: number;
}

interface DimensionsResult {
  width: number;
  height: number;
}

export function calculateDimensions({
  width,
  height,
  dimensions,
  maxWidth,
  fallbackWidth = 200,
  fallbackHeight = 200,
}: CalculateDimensionsArgs): DimensionsResult {
  // CASE A: Explicit width + height passed
  if (typeof width === 'number' && typeof height === 'number') {
    const aspectRatio = width / height;
    const finalWidth = Math.min(width, maxWidth);
    const finalHeight = finalWidth / aspectRatio;

    return {
      width: finalWidth,
      height: finalHeight,
    };
  }

  // CASE B: Fall back to natural dimensions or defaults
  const naturalWidth = dimensions?.width ?? fallbackWidth;
  const naturalHeight = dimensions?.height ?? fallbackHeight;
  const aspectRatio = naturalWidth / naturalHeight;
  const finalWidth = Math.min(naturalWidth, maxWidth);
  const finalHeight = finalWidth / aspectRatio;

  return {
    width: finalWidth,
    height: finalHeight,
  };
}
