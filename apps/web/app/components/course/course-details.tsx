import { Link } from 'react-router';
import { BookOpen, History, Pencil, Users, Wallet } from 'lucide-react';

import { timeAgo } from '@gonasi/utils/timeAgo';

import { buttonVariants } from '../ui/button';

interface Props {
  name: string;
  description: string | null;
  price: number | null;
  editLink: string;
  errorMessage?: string[];
  pricingModel: 'paid' | 'free';
  updatedAt: string;
}

export function CourseOverview({
  name,
  description,
  price,
  editLink,
  pricingModel,
  updatedAt,
}: Props) {
  return (
    <div className='flex flex-col space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg md:text-2xl'>{name}</h2>
        <Link to={editLink} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
          <Pencil />
        </Link>
      </div>
      <div className='font-secondary text-muted-foreground py-2 text-sm'>
        <p>{description ? description : 'No description provided...'}</p>
      </div>
      <div className='text-muted-foreground font-secondary flex flex-wrap items-center gap-4 text-sm'>
        <div className='flex items-center gap-1'>
          <BookOpen size={14} />
          <span>0 lessons</span>
        </div>
        <div className='flex items-center gap-1'>
          <Users size={14} />
          <span>0 Collaborators</span>
        </div>
        <div className='flex items-center gap-1'>
          <History size={14} />
          <span>{timeAgo(updatedAt)}</span>
        </div>
      </div>
      <div className='flex items-baseline justify-end space-x-1 py-4'>
        {pricingModel === 'paid' ? (
          <div>
            <span className='text-muted-foreground text-xs'>Ksh</span>
            <span className='text-2xl'>
              {price ? new Intl.NumberFormat('en-KE').format(price) : '__'}
            </span>
            <span className='text-muted-foreground font-secondary text-xs'>/month</span>
          </div>
        ) : (
          <div className='flex items-center space-x-2'>
            <Wallet strokeWidth={1} />
            <span className='mt-1'>Free</span>
          </div>
        )}
      </div>
    </div>
  );
}
