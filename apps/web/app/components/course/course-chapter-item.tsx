import { NavLink, useParams } from 'react-router';
import { Reorder, useDragControls, useMotionValue } from 'framer-motion';
import { BookOpen, ChevronsUpDown, Eye, GripVerticalIcon, Pencil, Trash } from 'lucide-react';

import { ActionDropdown } from '../action-dropdown';
import { Badge } from '../ui/badge';
import { ReorderIconTooltip } from '../ui/tooltip/ReorderIconToolTip';

import { useRaisedShadow } from '~/hooks/useRaisedShadow';
import { cn } from '~/lib/utils';
import type { CourseChapter } from '~/routes/organizations/builder/course/content/content-index';

interface ChapterBadgesProps {
  lessonCount: number;
}

// Renders badges for lesson count and payment requirement
function ChapterBadges({ lessonCount }: ChapterBadgesProps) {
  return (
    <div className='flex space-x-2'>
      <Badge variant='outline'>
        <BookOpen />
        {`${lessonCount} ${lessonCount === 1 ? 'lesson' : 'lessons'}`}
      </Badge>
    </div>
  );
}

interface Props {
  chapter: CourseChapter;
  loading: boolean;
  canEdit: boolean;
}

export default function CourseChapterItem({ chapter, loading, canEdit }: Props) {
  const params = useParams();

  const courseY = useMotionValue(0);
  const courseBoxShadow = useRaisedShadow(courseY);
  const courseDragControls = useDragControls();

  const basePath = `/${params.organizationId}/builder/${params.courseId}/content/${chapter.id}`;

  return (
    <Reorder.Item
      value={chapter}
      id={chapter.id}
      style={{ boxShadow: courseBoxShadow, y: courseY }}
      dragListener={false}
      dragControls={courseDragControls}
      layoutScroll
      className='select-none'
    >
      <div className='relative'>
        <div className='absolute top-3 -left-4'>
          <ReorderIconTooltip
            title='Drag and drop to rearrange chapters'
            icon={GripVerticalIcon}
            disabled={loading || !canEdit}
            dragControls={courseDragControls}
          />
        </div>
        <NavLink
          to={`/${params.organizationId}/builder/${params.courseId}/content/${chapter.id}/lessons`}
        >
          {({ isPending }) => (
            <div
              className={cn('bg-card/95 touch-none rounded-lg p-4', 'hover:cursor-pointer', {
                'disabled animate-pulse': loading || isPending,
              })}
            >
              <div className='flex w-full items-center justify-between'>
                {/* Chapter title and reorder icon */}
                <div className='flex items-center space-x-1'>
                  <h3 className='ml-4 line-clamp-1 text-left text-base md:text-lg'>
                    {chapter.name}
                  </h3>
                </div>

                {/* Chapter action controls */}
                <div className='flex items-center space-x-2'>
                  {canEdit ? (
                    <ActionDropdown
                      items={[
                        { title: 'View Lessons', icon: Eye, to: `${basePath}/lessons` },
                        { title: 'Edit chapter', icon: Pencil, to: `${basePath}/edit` },
                        { title: 'Delete chapter', icon: Trash, to: `${basePath}/delete` },
                      ]}
                    />
                  ) : (
                    <span>
                      <ChevronsUpDown size={14} className='text-muted-foreground' />
                    </span>
                  )}
                </div>
              </div>

              {chapter.description && (
                <div className='text-muted-foreground font-secondary line-clamp-4 py-2 text-sm md:text-base'>
                  {chapter.description}
                </div>
              )}

              {/* Badges for metadata */}
              <div className='flex w-full items-start'>
                <ChapterBadges lessonCount={chapter.lesson_count} />
              </div>
            </div>
          )}
        </NavLink>
      </div>
    </Reorder.Item>
  );
}
