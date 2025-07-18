import { blurhashToCssGradientString } from '@unpic/placeholder';
import { Image } from '@unpic/react';
import { motion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';

import { CardTitle } from '~/components/ui/card';
import { cn } from '~/lib/utils';

function GoCardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='go-card-content' className={cn('px-4 py-2', className)} {...props} />;
}

type AspectRatioOption = '16/9' | '4/3' | '1/1' | '3/2' | '9/16' | '4/1' | '263/100';

const aspectRatioClasses: Record<AspectRatioOption, string> = {
  '16/9': 'aspect-[16/9]', // standard video & responsive banner
  '4/3': 'aspect-[4/3]', // classic photo/video
  '1/1': 'aspect-square', // square (e.g., avatars)
  '3/2': 'aspect-[3/2]', // slightly taller than 16/9
  '9/16': 'aspect-[9/16]', // vertical reels/stories
  '4/1': 'aspect-[4/1]', // LinkedIn-style cover photo
  '263/100': 'aspect-[263/100]', // Facebook-style cover photo (~2.63:1)
};

interface GoThumbnailProps {
  iconUrl: string | null;
  blurHash: string | null;
  name: string;
  badges?: React.ReactNode[];
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down' | 'inherit' | 'initial';
  aspectRatio?: AspectRatioOption;
  noThumbnailText?: string;
}

function GoThumbnail({
  iconUrl,
  blurHash,
  name,
  badges = [],
  className,
  objectFit = 'cover',
  aspectRatio = '16/9',
  noThumbnailText = 'No thumbnail available',
}: GoThumbnailProps) {
  const placeholder = blurHash ? blurhashToCssGradientString(blurHash) : 'auto';
  const aspectClass = aspectRatioClasses[aspectRatio];

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
      <motion.div className='h-full w-full transition-transform duration-300 ease-in-out group-hover:scale-101'>
        {iconUrl ? (
          <Image
            src={iconUrl}
            layout='fullWidth'
            objectFit={objectFit}
            alt={`${name} thumbnail`}
            background={placeholder}
            className='h-full w-full object-cover'
          />
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
