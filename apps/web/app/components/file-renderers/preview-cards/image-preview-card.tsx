import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import type { FileLoaderItemType } from '~/routes/organizations/builder/course/file-library/file-library-index';

export const ImagePreviewCard = ({ file }: { file: FileLoaderItemType }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Use blur_url from Cloudinary if available (type-safe access)
  const blurUrl = 'blur_url' in file ? file.blur_url : null;

  // Check if image is already cached/loaded
  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, []);

  // Check if signed_url exists (from Cloudinary)
  if (!file.signed_url && !hasError) {
    return (
      <div className='bg-muted text-muted-foreground flex h-full w-full items-center justify-center rounded-md'>
        <p className='text-sm'>Loading image...</p>
      </div>
    );
  }

  if (hasError || !file.signed_url) {
    return (
      <div className='bg-muted text-muted-foreground flex h-full w-full items-center justify-center rounded-md'>
        <p className='text-sm'>Failed to load image</p>
      </div>
    );
  }

  return (
    <motion.div
      className='relative h-full w-full overflow-hidden transition-transform duration-300 ease-in-out group-hover:scale-101'
      style={{ aspectRatio: '16/9' }}
    >
      {/* Blur placeholder - shown while main image loads, fades out when loaded */}
      {blurUrl && !isLoaded && (
        <img
          src={blurUrl}
          alt=''
          aria-hidden='true'
          className='absolute inset-0 h-full w-full scale-110 object-cover blur-md'
          style={{ zIndex: 1, pointerEvents: 'none' }}
        />
      )}

      {/* Main image - always visible */}
      <img
        ref={imgRef}
        src={file.signed_url}
        alt={`${file.name} thumbnail`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className='absolute inset-0 h-full w-full object-contain'
        style={{ zIndex: 2 }}
        crossOrigin='anonymous'
      />
    </motion.div>
  );
};
