import { ImageIcon } from 'lucide-react';

import { Badge } from '~/components/ui/badge';

interface CourseThumbnailProps {
  iconUrl: string | null;
  name: string;
  badges?: string[];
  className?: string;
}

export function CourseThumbnail({ iconUrl, name, badges = [], className }: CourseThumbnailProps) {
  return (
    <div className={`bg-muted relative h-[200px] w-full overflow-hidden ${className}`}>
      {/* Multiple Badges */}
      {badges.length > 0 ? (
        <div className='absolute top-2 left-2 z-5 flex space-x-1'>
          {badges.map((badge, index) => (
            <Badge key={index}>{badge}</Badge>
          ))}
        </div>
      ) : null}

      {/* Image or fallback */}
      {iconUrl ? (
        <img src={iconUrl} alt={name} className='h-full w-full object-cover' />
      ) : (
        <div className='text-muted-foreground flex h-full w-full flex-col items-center justify-center'>
          <ImageIcon className='mb-2 h-12 w-12' />
          <span className='font-secondary'>No thumbnail available</span>
        </div>
      )}
    </div>
  );
}
