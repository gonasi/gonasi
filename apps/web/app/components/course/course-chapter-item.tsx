import { useEffect, useState } from 'react';
import { useFetcher, useParams } from 'react-router';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion';
import { Reorder, useDragControls, useMotionValue } from 'framer-motion';
import { BookOpen, CircleDollarSign, GripVerticalIcon, Pencil, Plus, Trash } from 'lucide-react';

import { ActionDropdown } from '../action-dropdown';
import { NotFoundCard } from '../cards';
import { LessonCard } from '../cards/lesson-card';
import { Badge } from '../ui/badge';
import { NavLinkButton } from '../ui/button';
import { ReorderIconTooltip } from '../ui/tooltip/ReorderIconToolTip';

import { useRaisedShadow } from '~/hooks/useRaisedShadow';
import { cn } from '~/lib/utils';
import type { CourseChapter } from '~/routes/profile/course-builder/courseId/content/content-index';

interface ChapterBadgesProps {
  lessonCount: number;
  requiresPayment: boolean | null;
}

// Renders badges for lesson count and payment requirement
function ChapterBadges({ lessonCount, requiresPayment }: ChapterBadgesProps) {
  return (
    <div className='flex space-x-2'>
      <Badge variant='outline'>
        <BookOpen />
        {`${lessonCount} ${lessonCount === 1 ? 'lesson' : 'lessons'}`}
      </Badge>
      {requiresPayment && (
        <Badge className='bg-success text-success-foreground'>
          <CircleDollarSign />
          Paid chapter
        </Badge>
      )}
    </div>
  );
}

interface Props {
  chapter: CourseChapter;
  loading: boolean;
}

type Lesson = CourseChapter['lessons'][number];

export default function CourseChapterItem({ chapter, loading }: Props) {
  const fetcher = useFetcher();
  const params = useParams();

  const [reorderedLessons, setReorderedLessons] = useState<Lesson[]>(chapter.lessons ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courseY = useMotionValue(0);
  const courseBoxShadow = useRaisedShadow(courseY);
  const courseDragControls = useDragControls();

  const basePath = `/${params.username}/course-builder/${params.courseId}/content/${chapter.id}`;

  // Sync internal reordered list with external chapter lessons
  useEffect(() => {
    setReorderedLessons(chapter.lessons ?? []);
  }, [chapter.lessons]);

  // Track if a form is being submitted
  useEffect(() => {
    setIsSubmitting(fetcher.state === 'submitting');
  }, [fetcher.state]);

  // Reorder lessons handler
  const handleLessonReorder = (updated: Lesson[]) => {
    setReorderedLessons(updated);

    const orderedData = updated.map((lesson, index) => ({
      id: lesson.id,
      position: index + 1,
    }));

    console.log(orderedData);

    const formData = new FormData();
    formData.append('intent', 'reorder-lessons');
    formData.append('lessons', JSON.stringify(orderedData));
    formData.append('chapterId', chapter.id);

    fetcher.submit(formData, {
      method: 'post',
      action: `/${params.username}/course-builder/${params.courseId}/content`,
    });
  };

  return (
    <Reorder.Item
      value={chapter}
      id={chapter.id}
      style={{ boxShadow: courseBoxShadow, y: courseY }}
      dragListener={false}
      dragControls={courseDragControls}
    >
      <div className='relative'>
        <div className='absolute top-3 -left-4'>
          <ReorderIconTooltip
            asChild
            title='Drag and drop to rearrange chapters'
            icon={GripVerticalIcon}
            disabled={loading}
            dragControls={courseDragControls}
          />
        </div>

        <AccordionItem
          value={chapter.id}
          className={cn('bg-card/95 touch-none rounded-lg p-4', 'hover:cursor-pointer', {
            'disabled animate-pulse': loading,
          })}
        >
          <AccordionTrigger className='w-full text-xl'>
            <div className='flex w-full items-center justify-between'>
              {/* Chapter title and reorder icon */}
              <div className='flex items-center space-x-1'>
                <h3 className='mt-1 ml-2 line-clamp-1 text-left text-lg'>{chapter.name}</h3>
              </div>

              {/* Chapter action controls */}
              <div className='flex items-center space-x-2'>
                <ActionDropdown
                  items={[
                    { title: 'Edit chapter', icon: Pencil, to: `${basePath}/edit` },
                    { title: 'Delete chapter', icon: Trash, to: `${basePath}/delete` },
                  ]}
                />
              </div>
            </div>

            {/* Badges for metadata */}
            <div className='flex w-full items-start'>
              <ChapterBadges
                lessonCount={chapter.lesson_count}
                requiresPayment={chapter.requires_payment}
              />
            </div>
          </AccordionTrigger>

          <AccordionContent>
            {/* Optional chapter description */}
            {chapter.description && (
              <div className='text-muted-foreground font-secondary line-clamp-4 py-2'>
                {chapter.description}
              </div>
            )}

            {/* Add lesson button */}
            <div className='flex w-full justify-end'>
              <NavLinkButton
                to={`${basePath}/new-lesson-details`}
                leftIcon={<Plus />}
                size='sm'
                variant='secondary'
              >
                Add lesson
              </NavLinkButton>
            </div>

            {/* Lessons list */}
            <div className='py-4'>
              {reorderedLessons.length === 0 ? (
                <NotFoundCard message='No lessons found' />
              ) : (
                <Reorder.Group axis='y' values={reorderedLessons} onReorder={handleLessonReorder}>
                  <div className='flex flex-col space-y-4'>
                    {reorderedLessons.map((lesson) => (
                      <LessonCard key={lesson.id} lesson={lesson} loading={isSubmitting} />
                    ))}
                  </div>
                </Reorder.Group>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </div>
    </Reorder.Item>
  );
}
