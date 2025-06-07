import { useEffect, useState } from 'react';
import { useFetcher, useParams } from 'react-router';
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
import { Badge } from '../ui/badge';
import { NavLinkButton } from '../ui/button';
import { IconTooltipButton } from '../ui/tooltip';

import { cn } from '~/lib/utils';
import type { CourseChapter } from '~/routes/profile/course-builder/courseId/content/content-index';

function useDndSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
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
      {requiresPayment && (
        <Badge className='bg-success text-success-foreground'>
          <CircleDollarSign />
          Paid chapter
        </Badge>
      )}
    </div>
  );
}

function buildLessonUpdateFormData(lessons: LessonPositionUpdateArray) {
  const formData = new FormData();
  formData.append('intent', 'reorder-lessons');
  formData.append('lessons', JSON.stringify(lessons));
  return formData;
}

interface Props {
  chapter: CourseChapter;
  loading: boolean;
}

export default function CourseChapterItem({ chapter, loading }: Props) {
  const fetcher = useFetcher();
  const params = useParams();
  const sensors = useDndSensors();

  const [lessons, setLessons] = useState(chapter.lessons ?? []);
  const [lessonLoading, setLessonLoading] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: chapter.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    setLessons(chapter.lessons ?? []);
  }, [chapter.lessons]);

  useEffect(() => {
    setLessonLoading(fetcher.state === 'submitting');
  }, [fetcher.state]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLessons((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over.id);
        const reordered = arrayMove(prev, oldIndex, newIndex);

        const simplified: LessonPositionUpdateArray = reordered.map(
          ({ id, chapter_id, course_id, name, created_by, updated_by }, index) => ({
            id,
            position: index,
            chapter_id,
            course_id,
            name,
            created_by,
            updated_by,
          }),
        );

        const formData = buildLessonUpdateFormData(simplified);
        fetcher.submit(formData, {
          method: 'post',
          action: `/${params.username}/course-builder/${params.courseId}/content`,
        });

        return reordered;
      });
    }
  }

  const basePath = `/${params.username}/course-builder/${params.courseId}/content/${chapter.id}`;

  return (
    <AccordionItem
      value={chapter.id}
      className={cn('bg-card/95 touch-none rounded-lg p-4', {
        'disabled animate-pulse': loading,
      })}
      ref={setNodeRef}
      style={style}
    >
      <AccordionTrigger className='w-full text-xl'>
        <div className='flex w-full items-center justify-between'>
          <div className='flex items-center space-x-1'>
            <ChevronsUpDown size={14} />
            <h3 className='mt-1 line-clamp-1 text-left text-lg'>{chapter.name}</h3>
          </div>
          <div className='flex items-center space-x-2'>
            <IconTooltipButton
              asChild
              className='cursor-move p-2'
              title='Drag and drop to rearrange chapters'
              icon={GripVerticalIcon}
              {...attributes}
              {...listeners}
              disabled={loading}
            />
            <ActionDropdown
              items={[
                { title: 'Edit chapter', icon: Pencil, to: `${basePath}/edit` },
                { title: 'Delete chapter', icon: Trash, to: `${basePath}/delete` },
              ]}
            />
          </div>
        </div>
        <div className='flex w-full items-start'>
          <ChapterBadges
            lessonCount={chapter.lesson_count}
            requiresPayment={chapter.requires_payment}
          />
        </div>
      </AccordionTrigger>

      <AccordionContent>
        {chapter.description && (
          <div className='text-muted-foreground font-secondary line-clamp-4 py-2'>
            {chapter.description}
          </div>
        )}
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
        <div className='flex flex-col space-y-4 py-4'>
          <DndContext
            modifiers={[restrictToVerticalAxis]}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={lessons} strategy={verticalListSortingStrategy}>
              {lessons.length > 0 ? (
                lessons.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} loading={lessonLoading} />
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
