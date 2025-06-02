import { Link } from 'react-router';
import { BookOpen, Calendar, Pencil, Users } from 'lucide-react';

import { buttonVariants } from '../ui/button';

interface Props {
  name: string;
  description: string | null;
  price: number | null;
  editLink: string;
  errorMessage?: string[];
}

export function CourseOverview({ name, description, price, editLink }: Props) {
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
          <BookOpen className='h-4 w-4' />
          <span>0 lessons</span>
        </div>
        <div className='flex items-center gap-1'>
          <Users className='h-4 w-4' />
          <span>0 students</span>
        </div>
        <div className='flex items-center gap-1'>
          <Calendar className='h-4 w-4' />
          <span>Updated date</span>
        </div>
      </div>
      <div className='flex items-baseline justify-end space-x-1 py-4'>
        <span className='text-muted-foreground text-xs'>Ksh</span>
        <span className='text-2xl'>
          {price ? new Intl.NumberFormat('en-KE').format(price) : '__'}
        </span>
        <span className='text-muted-foreground font-secondary text-xs'>/month</span>
      </div>
    </div>
  );
}
