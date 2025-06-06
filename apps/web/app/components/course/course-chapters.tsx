import { useEffect, useState } from 'react';
import { useFetcher } from 'react-router';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import type { ChapterPositionUpdateArray } from '@gonasi/schemas/courseChapters';

import { NotFoundCard } from '../cards';
import { Accordion } from '../ui/accordion';
import CourseChapterItem from './course-chapter-item';

import type { CourseChaptersType } from '~/routes/dashboard/courses/course-content';

interface Props {
  companyId: string;
  chapters: CourseChaptersType;
  courseId: string;
}

export function CourseChapters({ chapters, courseId, companyId }: Props) {
  const fetcher = useFetcher();

  const [myChapters, setMyChapters] = useState(chapters ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Update chapters if prop changes
    setMyChapters(chapters ?? []);
  }, [chapters]);

  // Set up an effect to monitor fetcher state
  useEffect(() => {
    if (fetcher.state === 'submitting') {
      setLoading(true);
    } else if (fetcher.state === 'idle' && fetcher.data) {
      setLoading(false);
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      let newChapters: typeof myChapters = [];

      setMyChapters((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        newChapters = arrayMove(items, oldIndex, newIndex);
        return newChapters;
      });

      if (newChapters.length) {
        const simplifiedChapters: ChapterPositionUpdateArray = newChapters.map(
          ({ id, course_id, name, created_by }, index) => ({
            id,
            position: index,
            course_id,
            name,
            created_by,
          }),
        );

        const formData = new FormData();

        formData.append('intent', 'reorder-chapters');
        formData.append('chapters', JSON.stringify(simplifiedChapters));

        fetcher.submit(formData, {
          method: 'post',
          action: `/dashboard/${companyId}/courses/${courseId}/course-content`,
        });
      }
    }
  }

  if (myChapters === null || myChapters.length === 0) {
    return <NotFoundCard message='No course chapters found' />;
  }

  return (
    <div>
      <DndContext
        modifiers={[restrictToVerticalAxis]}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={myChapters} strategy={verticalListSortingStrategy}>
          <Accordion type='single' collapsible className='flex w-full flex-col space-y-4'>
            {myChapters.length > 0 ? (
              myChapters.map(
                ({
                  id: chapterId,
                  name,
                  description,
                  course_id,
                  lessons,
                  requires_payment,
                  lesson_count,
                }) => {
                  return (
                    <CourseChapterItem
                      key={chapterId}
                      companyId={companyId}
                      chapterId={chapterId}
                      name={name}
                      description={description}
                      courseId={course_id}
                      lessons={lessons}
                      requires_payment={requires_payment}
                      lesson_count={lesson_count}
                      loading={loading}
                    />
                  );
                },
              )
            ) : (
              <NotFoundCard message='Chapters not found' />
            )}
          </Accordion>
        </SortableContext>
      </DndContext>
    </div>
  );
}
