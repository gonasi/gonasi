import { useEffect, useState } from 'react';

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
}): JSX.Element {
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

  const imageStyle = calculateDimensions({
    width,
    height,
    dimensions,
    maxWidth,
  });

  return (
    <>
      {!src && !hasError && (
        <div
          className={className || undefined}
          style={{
            background: placeholder,
            opacity: isLoaded ? 0 : 1,
            ...imageStyle,
          }}
        />
      )}
      {src && !hasError && (
        <img
          className={className || undefined}
          src={src}
          alt={altText}
          ref={imageRef}
          style={imageStyle}
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
      )}
    </>
  );
}
