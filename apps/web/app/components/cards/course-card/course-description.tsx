// File: components/CourseCard/CourseDescription.jsx
import { CircleAlert } from 'lucide-react';

import { CardDescription } from '~/components/ui/card';

interface CourseDescriptionProps {
  description: string | null;
}

export function CourseDescription({ description }: CourseDescriptionProps) {
  return (
    <CardDescription className='font-secondary mt-2 w-full text-sm'>
      {description ? (
        <div className='line-clamp-1'>{description}</div>
      ) : (
        <div className='bg-danger/5 text-danger flex w-full items-center space-x-2 rounded-lg px-2'>
          <CircleAlert size={12} />
          <span>No description added</span>
        </div>
      )}
    </CardDescription>
  );
}
