import { useState } from 'react';
import { blurhashToCssGradientString } from '@unpic/placeholder';
import { Image } from '@unpic/react';
import { ImageIcon } from 'lucide-react';

import { Badge } from '~/components/ui/badge';

interface CourseThumbnailProps {
  iconUrl: string | null;
  blurHash: string | null;
  name: string;
  badges?: string[];
  className?: string;
}

export function CourseThumbnail({
  iconUrl,
  blurHash,
  name,
  badges = [],
  className,
}: CourseThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const placeholder = blurHash ? blurhashToCssGradientString(blurHash) : 'auto';

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
        <Image
          src={iconUrl}
          layout='fullWidth'
          alt={`${name} thumbnail`}
          background={placeholder}
          onError={() => setImageError(true)}
        />
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
