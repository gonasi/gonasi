import { useState } from 'react';
import { EditIcon, ImageIcon } from 'lucide-react';

import { IconNavLink } from '../ui/button';

interface CourseThumbnailProps {
  thumbnail: string | null; // Signed URL from server
  blurUrl?: string | null; // Cloudinary blur URL
  name: string;
  editLink?: string;
}

export function CourseThumbnail({ thumbnail, name, editLink, blurUrl }: CourseThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // If thumbnail loading fails, show fallback
  if (imageError || !thumbnail) {
    return (
      <div className='relative aspect-[16/9] min-h-[200px] overflow-hidden'>
        {editLink ? (
          <IconNavLink
            to={editLink}
            icon={EditIcon}
            className='bg-secondary text-secondary-foreground hover:bg-secondary/80 absolute top-2 right-2 z-5 rounded-full p-2 transition-colors'
            aria-label={`Edit ${name}`}
          />
        ) : null}
        <div className='bg-muted text-muted-foreground flex h-full w-full flex-col items-center justify-center'>
          <ImageIcon className='mb-2 h-12 w-12' />
          <span className='font-secondary'>
            {imageError ? 'Failed to load thumbnail' : 'No thumbnail available'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className='relative aspect-[16/9] min-h-[200px] overflow-hidden'>
      {editLink ? (
        <IconNavLink
          to={editLink}
          icon={EditIcon}
          className='bg-secondary text-secondary-foreground hover:bg-secondary/80 absolute top-2 right-2 z-5 rounded-full p-2 transition-colors'
          aria-label={`Edit ${name}`}
        />
      ) : null}

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
        src={thumbnail}
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
    </div>
  );
}
