import { NavLink, useParams } from 'react-router';
import { Reorder, useDragControls, useMotionValue } from 'framer-motion';
import { GripVerticalIcon, Info, Pencil, Text, Trash } from 'lucide-react';

import { ActionDropdown } from '../action-dropdown';
import { Badge } from '../ui/badge';
import { ReorderIconTooltip } from '../ui/tooltip/ReorderIconToolTip';
import { LucideIconRenderer } from './lucide-icon-renderer';

import { useRaisedShadow } from '~/hooks/useRaisedShadow';
import { cn } from '~/lib/utils';
import type { LoaderLessonType } from '~/routes/organizations/builder/course/content/chapterId/lessonId/lessons-index';

interface Props {
  lesson: LoaderLessonType;
  loading: boolean;
  canEdit: boolean;
}

export function LessonCard({ lesson, loading, canEdit }: Props) {
  const params = useParams();

  const { lucide_icon, bg_color, name: typeName, description } = lesson.lesson_types;
  const basePath = `/${params.organizationId}/builder/${params.courseId}/content/${lesson.chapter_id}/${lesson.id}`;

  const lessonY = useMotionValue(0);
  const lessonBoxShadow = useRaisedShadow(lessonY, {
    borderRadius: '12px',
  });
  const lessonDragControls = useDragControls();

  const options = [
    { title: 'Edit details', icon: Pencil, to: `${basePath}/edit-lesson-details` },
    { title: 'Edit blocks', icon: Text, to: `${basePath}/lesson-blocks` },
    { title: 'Delete lesson', icon: Trash, to: `${basePath}/delete` },
  ];

  return (
    <Reorder.Item
      value={lesson}
      id={lesson.id}
      style={{ boxShadow: lessonBoxShadow, y: lessonY }}
      dragListener={false}
      dragControls={lessonDragControls}
      layoutScroll
      className='select-none'
    >
      <div className='relative'>
        <div className='absolute top-4 -left-0 z-5'>
          <ReorderIconTooltip
            title='Drag and drop to rearrange lessons'
            icon={GripVerticalIcon}
            disabled={loading || !canEdit}
            dragControls={lessonDragControls}
          />
        </div>

        <NavLink to={`${basePath}/lesson-blocks`}>
          {({ isPending }) => (
            <div
              className={cn(
                'group bg-card hover:border-primary/2 ml-4 flex flex-col space-y-3 rounded-xl border border-transparent p-4 transition-all duration-300 ease-in-out hover:border hover:shadow-sm',
                {
                  'disabled pointer-events-none animate-pulse opacity-50': loading || isPending,
                },
              )}
            >
              <div className='flex w-full items-start justify-between'>
                <div className='mt-1.5 ml-3 flex min-w-0 flex-1 items-center gap-1'>
                  <LucideIconRenderer
                    name={lucide_icon}
                    aria-hidden
                    color={bg_color}
                    strokeWidth={3}
                    className='shrink-0 rotate-[30deg] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-0'
                  />
                  <p className='group-hover:text-foreground truncate text-sm font-medium transition-colors md:text-base'>
                    {lesson.name}
                  </p>
                </div>

                {canEdit ? (
                  <div className='flex shrink-0 items-center gap-2'>
                    <ActionDropdown items={options} />
                  </div>
                ) : null}
              </div>

              {typeName && (
                <div className='flex flex-col justify-start space-y-1'>
                  <Badge
                    variant='outline'
                    className='group-hover:border-primary/30 group-hover:text-primary transition-colors duration-300'
                  >
                    {typeName}
                  </Badge>
                  <p className='font-secondary text-muted-foreground flex items-center space-x-1 px-1 text-xs'>
                    <Info size={14} />
                    <span>{description}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </NavLink>
      </div>
    </Reorder.Item>
  );
}
