import { useState } from 'react';
import { Link } from 'react-router';
import { blurhashToCssGradientString } from '@unpic/placeholder';
import { Image } from '@unpic/react';
import { EditIcon, ImageIcon } from 'lucide-react';

interface CourseThumbnailProps {
  thumbnail: string | null;
  blurHash: string | null;
  name: string;
  editLink?: string;
}

export function CourseThumbnail({ thumbnail, name, editLink, blurHash }: CourseThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const placeholder = blurHash ? blurhashToCssGradientString(blurHash) : 'auto';

  // If thumbnail loading fails, show fallback
  if (imageError || !thumbnail) {
    return (
      <div className='relative aspect-[16/9] min-h-[200px] overflow-hidden'>
        {editLink ? (
          <Link
            to={editLink}
            className='bg-secondary hover:bg-secondary/80 absolute top-2 right-2 z-5 rounded-full p-2 transition-colors'
            aria-label={`Edit ${name}`}
          >
            <EditIcon className='text-secondary-foreground h-5 w-5' />
          </Link>
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
        <Link
          to={editLink}
          className='bg-secondary hover:bg-secondary/80 absolute top-2 right-2 z-5 rounded-full p-2 transition-colors'
          aria-label={`Edit ${name}`}
        >
          <EditIcon className='text-secondary-foreground h-5 w-5' />
        </Link>
      ) : null}
      <Image
        src={thumbnail}
        layout='fullWidth'
        alt={`${name} thumbnail`}
        background={placeholder}
        onError={() => setImageError(true)}
      />
    </div>
  );
}
