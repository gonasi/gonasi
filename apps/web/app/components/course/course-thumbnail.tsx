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
  const placeholder = blurHash ? blurhashToCssGradientString(blurHash) : 'auto';

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
      {thumbnail ? (
        <Image
          src={thumbnail}
          layout='fullWidth'
          alt={`${name} thumbnail`}
          background={placeholder}
        />
      ) : (
        <div className='bg-muted text-muted-foreground flex h-full w-full flex-col items-center justify-center'>
          <ImageIcon className='mb-2 h-12 w-12' />
          <span className='font-secondary'>No thumbnail available</span>
        </div>
      )}
    </div>
  );
}
