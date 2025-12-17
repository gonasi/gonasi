import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

import { Badge } from '~/components/ui/badge';

interface CourseThumbnailProps {
  iconUrl: string | null; // Signed URL from server
  blurUrl?: string | null; // Cloudinary blur URL
  name: string;
  badges?: string[];
  className?: string;
}

export function CourseThumbnail({
  iconUrl,
  blurUrl,
  name,
  badges = [],
  className,
}: CourseThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className={`bg-muted relative aspect-[16/9] max-h-[360px] w-full overflow-hidden ${className}`}
    >
      {/* Multiple Badges */}
      {badges.length > 0 && (
        <div className='absolute top-2 left-2 z-5 flex space-x-1'>
          {badges.map((badge, index) => (
            <Badge key={index}>{badge}</Badge>
          ))}
        </div>
      )}

      {/* Image or fallback */}
      {iconUrl && !imageError ? (
        <>
          {/* Cloudinary blur placeholder background */}
          {blurUrl && !isLoaded && (
            <div
              className='absolute inset-0'
              style={{
                backgroundImage: `url(${blurUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 1,
              }}
            />
          )}

          {/* Main image */}
          <img
            src={iconUrl}
            alt={`${name} thumbnail`}
            onLoad={() => setIsLoaded(true)}
            onError={() => setImageError(true)}
            className='relative h-full w-full object-cover'
            style={{
              zIndex: 2,
            }}
            loading='lazy'
            crossOrigin='anonymous'
          />
        </>
      ) : (
        <div className='text-muted-foreground absolute inset-0 flex flex-col items-center justify-center'>
          <ImageIcon className='mb-2 h-12 w-12' />
          <span className='font-secondary'>
            {imageError ? 'Failed to load thumbnail' : 'No thumbnail available'}
          </span>
        </div>
      )}
    </div>
  );
}
