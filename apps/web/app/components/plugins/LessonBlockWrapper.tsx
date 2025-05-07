import { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVerticalIcon, Pencil, Trash } from 'lucide-react';

import { ActionDropdown } from '../action-dropdown';
import { IconTooltipButton } from '../ui/tooltip';

import { cn } from '~/lib/utils';

interface LessonBlockWrapperProps {
  id: string;
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  loading?: boolean;
}

export default function LessonBlockWrapper({
  id,
  children,
  onEdit,
  onDelete,
  loading,
}: LessonBlockWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  });

  const style = {
    transform: isMounted ? CSS.Transform.toString(transform) : undefined,
    transition: isMounted ? transition : undefined,
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      className='bg-card/20 rounded-lg pt-6'
      ref={isMounted ? setNodeRef : undefined}
      style={style}
    >
      <div className={cn('relative m-2 p-2')}>
        <>
          <div className='absolute -top-4 -left-4'>
            <IconTooltipButton
              asChild
              className='bg-card/80 cursor-move p-2'
              title='Drag and drop to rearrange blocks'
              icon={GripVerticalIcon}
              {...(isMounted ? attributes : {})}
              {...(isMounted ? listeners : {})}
              disabled={loading}
            />
          </div>
          <div className='bg-card/80 absolute -top-4 -right-4 rounded-lg'>
            <ActionDropdown
              items={[
                { title: 'Edit', icon: Pencil, onClick: onEdit },
                { title: 'Delete', icon: Trash, onClick: onDelete },
              ]}
            />
          </div>
        </>
        <div className='mt-4'>{children}</div>
      </div>
    </div>
  );
}
