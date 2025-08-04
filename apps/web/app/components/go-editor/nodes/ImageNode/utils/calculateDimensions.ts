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

type CSSStyleDimensions = React.CSSProperties;

export function calculateDimensions({
  width,
  height,
  dimensions,
  maxWidth,
  fallbackWidth = 200,
  fallbackHeight = 200,
}: CalculateDimensionsArgs): CSSStyleDimensions {
  // CASE A: Explicit width + height passed
  if (typeof width === 'number' && typeof height === 'number') {
    const aspectRatio = width / height;

    return {
      width: '100%',
      maxWidth: `${Math.min(width, maxWidth)}px`,
      height: 'auto',
      aspectRatio: aspectRatio.toString(),
    };
  }

  // CASE B: Fall back to natural dimensions or defaults
  const naturalWidth = dimensions?.width ?? fallbackWidth;
  const naturalHeight = dimensions?.height ?? fallbackHeight;
  const aspectRatio = naturalWidth / naturalHeight;

  return {
    width: '100%',
    maxWidth: `${Math.min(naturalWidth, maxWidth)}px`,
    height: 'auto',
    aspectRatio: aspectRatio.toString(),
  };
}
