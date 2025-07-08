import { Link } from 'react-router';
import { EditIcon } from 'lucide-react';

import { buttonVariants } from '../ui/button';

interface Props {
  category?: string | null;
  subCategory?: string | null;
  editLink?: string;
}

export function CourseCategoryOverview({ category, subCategory, editLink }: Props) {
  return (
    <div className='border-card rounded-md border-0 px-0 py-4 md:border md:px-4'>
      <div className='flex items-center justify-between pb-4'>
        <h2 className='text-xl'>How it’s grouped</h2>
        {editLink ? (
          <Link
            to={editLink}
            className={buttonVariants({ variant: 'secondary', size: 'sm' })}
            aria-label='Edit category details'
          >
            <EditIcon />
          </Link>
        ) : null}
      </div>
      <div className='space-y-3'>
        {[
          { label: 'Category', value: category, emptyMsg: 'Category is missing' },
          { label: 'Sub category', value: subCategory, emptyMsg: 'No sub category added' },
        ].map(({ label, value, emptyMsg }) => (
          <div key={label} className='flex flex-col space-y-2'>
            <span className='text-muted-foreground font-secondary text-xs'>{label}</span>
            {value ? (
              <span>{value}</span>
            ) : (
              <span className='bg-danger/20 w-fit rounded-sm px-2 py-1 text-xs'>{emptyMsg}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
