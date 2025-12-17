import { useState } from 'react';
import { motion } from 'framer-motion';

import type { FileLoaderItemType } from '~/routes/organizations/builder/course/file-library/file-library-index';

export const ImagePreviewCard = ({ file }: { file: FileLoaderItemType }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Use blur_url from Cloudinary if available (type-safe access)
  const blurUrl = 'blur_url' in file ? file.blur_url : null;

  // Check if signed_url exists (from Cloudinary)
  if (!file.signed_url) {
    return (
      <div className='bg-muted text-muted-foreground flex h-full w-full items-center justify-center rounded-md'>
        <p className='text-sm'>No image URL</p>
      </div>
    );
  }

  if (hasError) {
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
      {/* Blur placeholder - shown behind main image while it loads */}
      {blurUrl && !isLoaded && (
        <div
          className='absolute inset-0 h-full w-full'
          style={{
            backgroundImage: `url(${blurUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 1,
          }}
        />
      )}

      {/* Main image - uses server-generated signed URL */}
      <img
        src={file.signed_url}
        alt={`${file.name} thumbnail`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className='absolute inset-0 h-full w-full object-contain'
        style={{
          zIndex: 2,
        }}
        crossOrigin='anonymous'
      />
    </motion.div>
  );
};
