import { NavLink } from 'react-router';
import { StarOff } from 'lucide-react';

import { CourseDescription } from './course-description';
import { CourseHeader } from './course-header';
import { CourseMetadata } from './course-metadata';
import { CoursePrice } from './course-price';
import { CourseThumbnail } from './course-thumbnail';

import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card';
import { cn } from '~/lib/utils';

export interface CourseCardProps {
  name: string;
  author: {
    displayName: string;
    imageUrl: string | null;
  };
  description: string | null;
  iconUrl: string | null;
  blurHash: string | null;
  lessonsCount: number | null;
  chaptersCount: number | null;
  to: string;
  price: number | null;
  category?: string | null;
  subcategory?: string | null;
  updatedAt: string;
  status: string | null;
}

export function CourseCard({
  name,
  author,
  description,
  iconUrl,
  blurHash,
  lessonsCount,
  chaptersCount,
  price,
  to,
  category,
  subcategory,
  updatedAt,
}: CourseCardProps) {
  // TODO: Implement badge algo
  const badges: string[] = [];

  return (
    <NavLink to={to} className='-px-10'>
      {({ isPending }) => (
        <Card
          className={cn(
            'hover:bg-primary/5 h-full w-full overflow-hidden pt-0 transition-all duration-200 hover:shadow-md',
            'rounded-none md:rounded-lg',
            'gap-0 pb-0',
            {
              'bg-primary/5': isPending,
            },
          )}
        >
          <CardHeader className='text-primary p-0'>
            <CourseThumbnail iconUrl={iconUrl} name={name} badges={badges} />
          </CardHeader>

          <CardContent className='bg-background md:bg-card w-full p-4'>
            <div className='pb-2'>
              <StarOff size={14} />
            </div>
            <CourseHeader name={name} />
            <CourseDescription description={description} />
            <CourseMetadata
              author={author}
              category={category}
              subcategory={subcategory}
              chaptersCount={chaptersCount}
              lessonsCount={lessonsCount}
              updatedAt={updatedAt}
            />

            <CardFooter className='border-t-card-border/50 mt-4 border-t'>
              <CoursePrice price={price} />
            </CardFooter>
          </CardContent>
        </Card>
      )}
    </NavLink>
  );
}
