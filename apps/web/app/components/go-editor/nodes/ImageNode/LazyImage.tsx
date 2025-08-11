import { useEffect, useState } from 'react';
import type { LexicalEditor } from 'lexical';

import { calculateDimensions } from './utils/calculateDimensions';
import ImageResizer from './ImageResizer';

interface ResizerProps {
  editor: LexicalEditor;
  onResizeStart: () => void;
  onResizeEnd: (width: 'inherit' | number, height: 'inherit' | number) => void;
}

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
  showResizer = false,
  resizerProps,
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
  showResizer?: boolean;
  resizerProps?: ResizerProps;
}) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Set initial dimensions for SVG images
  useEffect(() => {
    if (imageRef.current && isSVGImage) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setDimensions({ height: naturalHeight, width: naturalWidth });
    }
  }, [imageRef, isSVGImage]);

  const { width: calculatedWidth, height: calculatedHeight } = calculateDimensions({
    width,
    height,
    dimensions,
    maxWidth,
  });

  const initialStyle = {
    width: typeof calculatedWidth === 'number' ? `${calculatedWidth}px` : 'auto',
    height: typeof calculatedHeight === 'number' ? `${calculatedHeight}px` : 'auto',
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Background blur/placeholder */}
      {!hasError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: placeholder,
            opacity: isLoaded ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}

      {src && !hasError ? (
        <div
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <img
            className={className || undefined}
            src={src}
            alt={altText}
            ref={imageRef}
            draggable='false'
            style={{ ...initialStyle, objectFit: 'contain' }}
            onError={onError}
            onLoad={(e) => {
              if (isSVGImage) {
                const img = e.currentTarget;
                setDimensions({ height: img.naturalHeight, width: img.naturalWidth });
              }
              onLoad();
            }}
          />
        </div>
      ) : (
        <div
          className={className || undefined}
          style={{
            ...initialStyle,
            background: placeholder,
            position: 'relative',
            zIndex: 1,
          }}
        />
      )}

      {/* Inline resizer */}
      {showResizer && resizerProps && (
        <ImageResizer
          editor={resizerProps.editor}
          imageRef={imageRef}
          onResizeStart={resizerProps.onResizeStart}
          onResizeEnd={resizerProps.onResizeEnd}
        />
      )}
    </div>
  );
}
