import { useEffect, useState } from 'react';
import { Image } from '@unpic/react';

import { calculateDimensions } from './utils/calculateDimensions';

export function LazyImage({
  altText,
  className,
  imageRef,
  src,
  isSVGImage,
  width,
  height,
  maxWidth,
  onError,
  placeholder,
  isLoaded,
  onLoad,
  hasError,
}: {
  altText: string;
  className: string | null;
  height: 'inherit' | number;
  imageRef: { current: null | HTMLImageElement };
  maxWidth: number;
  src: string;
  isSVGImage: boolean;
  width: 'inherit' | number;
  onError: () => void;
  placeholder: string;
  isLoaded: boolean;
  onLoad: () => void;
  hasError: boolean;
}) {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Set initial dimensions for SVG images
  useEffect(() => {
    if (imageRef.current && isSVGImage) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setDimensions({
        height: naturalHeight,
        width: naturalWidth,
      });
    }
  }, [imageRef, isSVGImage]);

  const { width: calculatedWidth, height: calculatedHeight } = calculateDimensions({
    width,
    height,
    dimensions,
    maxWidth,
  });

  // Create a wrapper that maintains the image's natural positioning for the resizer
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Background blur/placeholder - positioned behind */}
      {!hasError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: placeholder,
            opacity: isLoaded ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* The actual image - positioned normally for resizer compatibility */}
      {src && !hasError ? (
        <div
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Image
            className={className || undefined}
            src={src}
            alt={altText}
            ref={imageRef}
            width={calculatedWidth}
            height={calculatedHeight}
            onError={onError}
            draggable='false'
            onLoad={(e) => {
              if (isSVGImage) {
                const img = e.currentTarget;
                setDimensions({
                  height: img.naturalHeight,
                  width: img.naturalWidth,
                });
              }
              onLoad();
            }}
          />
        </div>
      ) : (
        // Fallback placeholder when no src or error
        <div
          className={className || undefined}
          style={{
            width: calculatedWidth,
            height: calculatedHeight,
            background: placeholder,
            position: 'relative',
            zIndex: 1,
          }}
        />
      )}
    </div>
  );
}
