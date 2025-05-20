import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVerticalIcon, Info, Pencil, Text, Trash } from 'lucide-react';

import { ActionDropdown } from '../action-dropdown';
import { Badge } from '../ui/badge';
import { IconTooltipButton } from '../ui/tooltip';
import { LucideIconRenderer } from './lucide-icon-renderer';

interface Props {
  companyId: string;
  courseId: string;
  chapterId: string;
  lessonId: string;
  title: string;
  loading: boolean;
  lucideIcon?: string;
  lessonTypeName?: string;
  lessonTypeIconColor?: string;
  lessonTypeDescription?: string;
}

export function LessonCard({
  companyId,
  courseId,
  chapterId,
  lessonId,
  title,
  loading,
  lucideIcon,
  lessonTypeName,
  lessonTypeIconColor,
  lessonTypeDescription,
}: Props) {
  const basePath = `/dashboard/${companyId}/courses/${courseId}/course-content/${chapterId}/${lessonId}`;
  const [isMounted, setIsMounted] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: lessonId,
  });

  const style = {
    transform: isMounted ? CSS.Transform.toString(transform) : undefined,
    transition: isMounted ? transition : undefined,
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const options = [
    {
      title: 'Edit details',
      icon: Pencil,
      to: `${basePath}/edit-lesson-details`,
    },
    {
      title: 'Edit content',
      icon: Text,
      to: `${basePath}`,
    },
    {
      title: 'Delete lesson',
      icon: Trash,
      to: `${basePath}/delete`,
    },
  ];

  return (
    <Link
      to={`${basePath}`}
      ref={isMounted ? setNodeRef : undefined}
      style={style}
      className='group bg-background/50 hover:bg-primary/2 flex flex-col space-y-3 rounded-xl border border-transparent p-4 transition-all duration-300 ease-in-out hover:border hover:shadow-sm'
    >
      <div className='flex w-full items-start justify-between'>
        <div className='flex min-w-0 flex-1 items-center gap-3'>
          <LucideIconRenderer
            name={lucideIcon}
            aria-hidden
            color={lessonTypeIconColor}
            strokeWidth={3}
            className='shrink-0 rotate-[30deg] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-0'
          />
          <p className='group-hover:text-foreground truncate text-base font-medium transition-colors'>
            {title}
          </p>
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <IconTooltipButton
            asChild
            className='cursor-move p-2'
            title='Drag and drop to rearrange lessons'
            icon={GripVerticalIcon}
            {...(isMounted ? attributes : {})}
            {...(isMounted ? listeners : {})}
            disabled={loading}
          />
          <ActionDropdown items={options} />
        </div>
      </div>
      {lessonTypeName && (
        <div className='flex flex-col justify-start space-y-1'>
          <Badge
            variant='outline'
            className='group-hover:border-primary/30 group-hover:text-primary transition-colors duration-300'
          >
            {lessonTypeName}
          </Badge>
          <p className='font-secondary text-muted-foreground flex items-center space-x-1 px-1 text-xs'>
            <Info size={14} />
            <span>{lessonTypeDescription}</span>
          </p>
        </div>
      )}
    </Link>
  );
}
