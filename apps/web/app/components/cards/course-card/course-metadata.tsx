import { BookOpen, CircleAlert, Clock, TableOfContents } from 'lucide-react';

import { timeAgo } from '@gonasi/utils/timeAgo';

import { UserAvatar } from '~/components/avatars';
import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';

interface CourseMetadataProps {
  author: {
    displayName: string;
    imageUrl: string | null;
  };
  category: string | null | undefined;
  subcategory: string | null | undefined;
  chaptersCount: number | null;
  lessonsCount: number | null;
  updatedAt: string;
}

export function CourseMetadata({
  author,
  category,
  subcategory,
  chaptersCount,
  lessonsCount,
  updatedAt,
}: CourseMetadataProps) {
  const renderBadge = (value: string | null | undefined, fallback: string) => (
    <Badge
      variant='outline'
      className={cn('font-secondary hover:bg-primary/30', {
        'bg-danger/5 text-danger border-danger/5': !value,
      })}
    >
      {value ? (
        value
      ) : (
        <div className='flex items-center space-x-1'>
          <CircleAlert size={12} />
          <span>{fallback}</span>
        </div>
      )}
    </Badge>
  );

  return (
    <div className='flex flex-col space-y-2 py-2'>
      <UserAvatar username={author.displayName} imageUrl={author.imageUrl} size='xs' />
      <div className='flex w-full items-center space-x-2'>
        {renderBadge(category, 'No category')}
        {renderBadge(subcategory, 'No subcategory')}
      </div>
      <div className='flex w-full items-center space-x-8 pt-2'>
        <div className='flex items-center space-x-1'>
          <TableOfContents size={12} />
          <span>{`${chaptersCount} ${chaptersCount === 1 ? 'chapter' : 'chapters'}`}</span>
        </div>
        <div className='flex items-center space-x-1'>
          <BookOpen size={12} />
          <span>{`${lessonsCount} ${lessonsCount === 1 ? 'lesson' : 'lessons'}`}</span>
        </div>
      </div>
      <p className='font-secondary flex items-center space-x-1 text-xs'>
        <Clock size={12} />
        <span>Updated </span>
        <span className='text-foreground font-bold'>{timeAgo(updatedAt)}</span>
      </p>
    </div>
  );
}
