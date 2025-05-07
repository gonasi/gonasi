import { Pencil, Trash } from 'lucide-react';

import { ActionDropdown } from '../action-dropdown';

import { cn } from '~/lib/utils';

interface LessonBlockWrapperProps {
  children: React.ReactNode;

  onEdit?: () => void;
  onDelete?: () => void;
}

export default function LessonBlockWrapper({
  children,

  onEdit,
  onDelete,
}: LessonBlockWrapperProps) {
  return (
    <div className='bg-card/20 rounded-lg'>
      <div className={cn('relative m-2 p-2')}>
        <>
          <div className='absolute -top-4 -left-4'>Left</div>
          <div className='bg-card/80 absolute -top-4 -right-4 rounded-lg'>
            <ActionDropdown
              items={[
                { title: 'Edit', icon: Pencil, onClick: onEdit },
                { title: 'Delete', icon: Trash, onClick: onDelete },
              ]}
            />
          </div>
        </>

        {children}
      </div>
    </div>
  );
}
