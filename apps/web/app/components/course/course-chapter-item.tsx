import { useEffect, useState } from 'react';
import { Link, useFetcher } from 'react-router';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion';
import {
  BookOpen,
  ChevronsUpDown,
  CircleDollarSign,
  GripVerticalIcon,
  Pencil,
  Plus,
  Trash,
} from 'lucide-react';

import type { LessonPositionUpdateArray } from '@gonasi/schemas/lessons';

import { ActionDropdown } from '../action-dropdown';
import { NotFoundCard } from '../cards';
import { LessonCard } from '../cards/lesson-card';
import { IconTooltipButton } from '../go-editor/ui/IconTooltipButton';
import { Badge } from '../ui/badge';
import { buttonVariants } from '../ui/button';

import { cn } from '~/lib/utils';
import type { CourseLessonType } from '~/routes/dashboard/courses/course-content';

interface Props {
  companyId: string;
  chapterId: string;
  name: string;
  description: string | null;
  courseId: string;
  lessons: CourseLessonType[];
  requires_payment: boolean | null;
  lesson_count: number;
  loading: boolean;
}

function ChapterBadges({
  lessonCount,
  requiresPayment,
}: {
  lessonCount: number;
  requiresPayment: boolean | null;
}) {
  return (
    <div className='flex space-x-2'>
      <Badge variant='outline'>
        <BookOpen />
        {`${lessonCount} ${lessonCount === 1 ? 'lesson' : 'lessons'}`}
      </Badge>
      {requiresPayment === true && (
        <Badge className='bg-success text-success-foreground'>
          <CircleDollarSign />
          Paid chapter
        </Badge>
      )}
    </div>
  );
}

export default function CourseChapterItem({
  chapterId,
  companyId,
  name,
  description,
  courseId,
  lessons,
  requires_payment,
  lesson_count,
  loading,
}: Props) {
  const fetcher = useFetcher();

  // Always use the hooks, but control when they take effect
  const [isMounted, setIsMounted] = useState(false);

  const [myLessons, setMyLessons] = useState(lessons ?? []);
  const [lessonLoading, setLessonsLoading] = useState(false);

  useEffect(() => {
    // Update lessons if prop changes
    setMyLessons(lessons ?? []);
  }, [lessons]);

  // Set up an effect to monitor fetcher state
  useEffect(() => {
    if (fetcher.state === 'submitting') {
      setLessonsLoading(true);
    } else if (fetcher.state === 'idle' && fetcher.data) {
      setLessonsLoading(false);
    }
  }, [fetcher.state, fetcher.data]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Always call useSortable, but only use its values when mounted
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: chapterId,
  });

  // Set up the mounting effect
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const style = {
    transform: isMounted ? CSS.Transform.toString(transform) : undefined,
    transition: isMounted ? transition : undefined,
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      let newLessons: typeof myLessons = [];

      setMyLessons((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        newLessons = arrayMove(items, oldIndex, newIndex);
        return newLessons;
      });

      if (newLessons.length) {
        const simplifiedlessons: LessonPositionUpdateArray = newLessons.map(
          ({ id, updated_by, chapter_id }, index) => ({
            id,
            position: index,
            updated_by,
            chapter_id,
          }),
        );

        const formData = new FormData();

        formData.append('intent', 'reorder-lessons');
        formData.append('lessons', JSON.stringify(simplifiedlessons));

        fetcher.submit(formData, {
          method: 'post',
          action: `/dashboard/${companyId}/courses/${courseId}/course-content`,
        });
      }
    }
  }

  return (
    <AccordionItem
      value={chapterId}
      key={chapterId}
      className={cn('bg-card/95 touch-none rounded-lg p-4', {
        'disabled animate-pulse': loading,
      })}
      ref={isMounted ? setNodeRef : undefined}
      style={style}
    >
      <AccordionTrigger className='w-full text-xl'>
        <div className='flex w-full flex-row items-center justify-between'>
          <div className='w-full'>
            <div className='flex w-full items-center justify-between'>
              <div className='flex items-center space-x-1'>
                <ChevronsUpDown size={14} />
                <h3 className='mt-1 line-clamp-1 text-left text-lg'>{name}</h3>
              </div>
              <div className='flex items-center space-x-2'>
                <IconTooltipButton
                  asChild
                  className='cursor-move p-2'
                  title='Drag and drop to rearrange chapters'
                  icon={GripVerticalIcon}
                  {...(isMounted ? attributes : {})}
                  {...(isMounted ? listeners : {})}
                  disabled={loading}
                />
                <ActionDropdown
                  items={[
                    {
                      title: 'Edit Chapter',
                      icon: Pencil,
                      to: `/dashboard/${companyId}/courses/${courseId}/course-content/${chapterId}/edit-chapter`,
                    },
                    {
                      title: 'Delete Chapter',
                      icon: Trash,
                      to: `/dashboard/${companyId}/courses/${courseId}/course-content/${chapterId}/delete-chapter`,
                    },
                  ]}
                />
              </div>
            </div>
            <div className='flex w-full items-center justify-between pt-2'>
              <ChapterBadges lessonCount={lesson_count} requiresPayment={requires_payment} />
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {description && (
          <div className='text-muted-foreground font-secondary line-clamp-4 py-2'>
            {description}
          </div>
        )}
        <div className='flex w-full justify-end'>
          <Link
            to={`/dashboard/${companyId}/courses/${courseId}/course-content/${chapterId}/new-lesson-details`}
            className={buttonVariants({ variant: 'default', size: 'sm' })}
          >
            <Plus /> Add Lesson
          </Link>
        </div>
        <div className='flex flex-col space-y-4 py-4'>
          <DndContext
            modifiers={[restrictToVerticalAxis]}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={myLessons} strategy={verticalListSortingStrategy}>
              {myLessons.length > 0 ? (
                myLessons.map(({ id: lessonId, name, lesson_types }) => (
                  <LessonCard
                    key={lessonId}
                    companyId={companyId}
                    lessonId={lessonId}
                    courseId={courseId}
                    title={name}
                    chapterId={chapterId}
                    loading={lessonLoading}
                    lucideIcon={lesson_types?.lucide_icon}
                    lessonTypeName={lesson_types?.name}
                    lessonTypeDescription={lesson_types?.description}
                    lessonTypeIconColor={lesson_types?.bg_color}
                  />
                ))
              ) : (
                <NotFoundCard message='No lessons available' />
              )}
            </SortableContext>
          </DndContext>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
