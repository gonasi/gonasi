import { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';

import {
  AspectRatioClasses,
  type AspectRatioOption,
  type ObjectFitType,
} from '@gonasi/schemas/file';

import { CardTitle } from '~/components/ui/card';
import { cn } from '~/lib/utils';

function GoCardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='go-card-content' className={cn('px-4 py-2', className)} {...props} />;
}

interface GoThumbnailProps {
  iconUrl: string | null;
  blurUrl?: string | null; // Cloudinary blur URL
  name: string;
  badges?: React.ReactNode[];
  className?: string;
  objectFit?: ObjectFitType;
  aspectRatio?: AspectRatioOption;
  noThumbnailText?: string;
}

function GoThumbnail({
  iconUrl,
  blurUrl,
  name,
  badges = [],
  className,
  objectFit = 'cover',
  aspectRatio = '16/9',
  noThumbnailText = 'No thumbnail available',
}: GoThumbnailProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const aspectClass = AspectRatioClasses[aspectRatio];

  return (
    <div
      className={`group bg-muted relative max-h-[360px] w-full overflow-hidden ${aspectClass} ${className}`}
    >
      {/* Badges */}
      {badges.length > 0 && (
        <div className='absolute top-2 left-2 z-5 flex space-x-1'>
          {badges.map((badge, index) => (
            <span key={index}>{badge}</span>
          ))}
        </div>
      )}

      {/* Image or fallback with consistent hover animation */}
      <motion.div className='relative h-full w-full transition-transform duration-300 ease-in-out group-hover:scale-101'>
        {iconUrl ? (
          <>
            {/* Cloudinary blur placeholder - shown behind main image while it loads */}
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

            {/* Main image */}
            <img
              src={iconUrl}
              alt={`${name} thumbnail`}
              onLoad={() => setIsLoaded(true)}
              className='relative h-full w-full object-cover'
              style={{
                zIndex: 2,
              }}
              loading='lazy'
              crossOrigin='anonymous'
            />
          </>
        ) : (
          <div className='text-muted-foreground bg-muted flex h-full w-full flex-col items-center justify-center'>
            <ImageIcon className='h-12 w-12' />
            <span className='font-secondary text-sm md:text-base'>{noThumbnailText}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

interface CourseHeaderProps {
  name: string;
  className?: string;
}

function GoCourseHeader({ name, className }: CourseHeaderProps) {
  return <CardTitle className={cn('text-md line-clamp-2', className)}>{name}</CardTitle>;
}

export { GoThumbnail, GoCourseHeader, GoCardContent };
