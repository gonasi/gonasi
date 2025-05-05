import { Link } from 'react-router';
import { LibraryBig, MoveRight } from 'lucide-react';

import { Badge } from '../ui/badge';
import { buttonVariants } from '../ui/button';

import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '~/components/ui/card';

interface CategoryProps {
  title: string;
  description: string;
  to: string;
  iconUrl: string;
  courseCount: number;
  isFeatured?: boolean;
}

const borderColors = [
  'border-t-primary',
  'border-t-secondary',
  'border-t-destructive',
  'border-t-muted',
  'border-t-accent',
  'border-t-green-500',
  'border-t-blue-500',
  'border-t-yellow-500',
  'border-t-pink-500',
  'border-t-orange-500',
];

// Generates a stable pseudo-random index based on a string
function getStableIndex(input: string, length: number) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % length;
}

export function PathwaysCard({
  title,
  description,
  to,
  iconUrl,
  courseCount,
  isFeatured = true,
}: CategoryProps) {
  const stableIndex = getStableIndex(title, borderColors.length);
  const borderClass = borderColors[stableIndex];

  return (
    <Card className={`h-full overflow-hidden border-t-4 ${borderClass}`}>
      <CardContent className='px-4'>
        <div className='flex items-center justify-between'>
          <img
            src={iconUrl}
            alt={title}
            className='border-card-border/10 h-8 w-8 rounded-md border object-cover'
          />

          {isFeatured ? (
            <Link to={to}>
              <Badge
                variant='outline'
                className='hover:border-primary hover:text-primary transition-colors'
              >
                Featured
              </Badge>
            </Link>
          ) : null}
        </div>

        <CardTitle className='text-md mb-2 line-clamp-1'>{title}</CardTitle>

        <CardDescription className='font-secondary line-clamp-1 text-sm'>
          <div>{description}</div>
        </CardDescription>

        <CardFooter className='w-full'>
          <div className='flex w-full flex-col'>
            <div className='font-secondary text-muted-foreground flex items-center space-x-1 py-4'>
              <LibraryBig size={14} />
              <span className='text-foreground font-bold'>{courseCount}</span>
              <span className='text-xs'>{courseCount === 1 ? 'Course' : 'Courses'}</span>
            </div>

            <Link className={buttonVariants({ variant: 'secondary', size: 'sm' })} to={to}>
              <span>Explore pathway</span>
              <MoveRight />
            </Link>
          </div>
        </CardFooter>
      </CardContent>
    </Card>
  );
}
