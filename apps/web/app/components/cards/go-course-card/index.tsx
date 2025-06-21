import { blurhashToCssGradientString } from '@unpic/placeholder';
import { Image } from '@unpic/react';
import { motion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';

import { Badge } from '~/components/ui/badge';
import { CardTitle } from '~/components/ui/card';
import { cn } from '~/lib/utils';

function GoCardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='go-card-content' className={cn('px-4 py-2', className)} {...props} />;
}

interface GoThumbnailProps {
  iconUrl: string | null;
  blurHash: string | null;
  name: string;
  badges?: string[];
  className?: string;
}

function GoThumbnail({ iconUrl, blurHash, name, badges = [], className }: GoThumbnailProps) {
  const placeholder = blurHash ? blurhashToCssGradientString(blurHash) : 'auto';

  return (
    <div
      className={`group bg-muted relative aspect-[16/9] max-h-[360px] w-full overflow-hidden ${className}`}
    >
      {/* Badges */}
      {badges.length > 0 && (
        <div className='absolute top-2 left-2 z-5 flex space-x-1'>
          {badges.map((badge, index) => (
            <Badge key={index}>{badge}</Badge>
          ))}
        </div>
      )}

      {/* Image or fallback with consistent hover animation */}
      <motion.div className='h-full w-full transition-transform duration-300 ease-in-out group-hover:scale-101'>
        {iconUrl ? (
          <Image
            src={iconUrl}
            layout='fullWidth'
            objectFit='cover'
            alt={`${name} thumbnail`}
            background={placeholder}
            className='h-full w-full object-cover'
          />
        ) : (
          <div className='text-muted-foreground bg-muted flex h-full w-full flex-col items-center justify-center'>
            <ImageIcon className='h-12 w-12' />
            <span className='font-secondary text-sm md:text-base'>No thumbnail available</span>
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
