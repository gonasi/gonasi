import { Link } from 'react-router';
import { EditIcon } from 'lucide-react';

import { buttonVariants } from '../ui/button';

interface Props {
  category?: string | null;
  subCategory?: string | null;
  pathway?: string | null;
  editLink: string;
}

export function CourseCategoryOverview({ category, subCategory, pathway, editLink }: Props) {
  return (
    <div className='border-card rounded-md border-0 px-0 py-4 md:border md:px-4'>
      <div className='flex items-center justify-between pb-4'>
        <h2 className='text-xl'>Grouping</h2>
        <Link
          to={editLink}
          className={buttonVariants({ variant: 'secondary', size: 'sm' })}
          aria-label='Edit category details'
        >
          <EditIcon />
        </Link>
      </div>
      <div className='space-y-3'>
        {[
          { label: 'Pathway', value: pathway },
          { label: 'Category', value: category },
          { label: 'Subcategory', value: subCategory },
        ].map(({ label, value }) => (
          <div key={label} className='flex flex-col space-y-2'>
            <span className='text-muted-foreground font-secondary text-xs'>{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
