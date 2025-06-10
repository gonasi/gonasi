import { Link } from 'react-router';
import { BookOpen, History, Pencil, Users } from 'lucide-react';

import { timeAgo } from '@gonasi/utils/timeAgo';

import { buttonVariants } from '../ui/button';

interface Props {
  name: string;
  description: string | null;
  editLink: string;
  errorMessage?: string[];
  updatedAt: string;
}

export function CourseOverview({ name, description, editLink, updatedAt }: Props) {
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
    </div>
  );
}
