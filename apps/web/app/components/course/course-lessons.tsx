import { useEffect, useState } from 'react';
import { useFetcher, useParams } from 'react-router';
import { motion, Reorder } from 'framer-motion';

import { NotFoundCard } from '../cards';
import { LessonCard } from '../cards/lesson-card';

import type { LoaderLessonType } from '~/routes/organizations/builder/course/content/chapterId/lessonId/lessons-index';

interface Props {
  lessons: LoaderLessonType[];
  canEdit: boolean;
}

export function CourseLessons({ lessons, canEdit }: Props) {
  const fetcher = useFetcher();
  const params = useParams();

  const [reorderedLessons, setReorderedLessons] = useState<LoaderLessonType[]>(lessons ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync local state with latest lessons from props
  useEffect(() => {
    setReorderedLessons(lessons ?? []);
  }, [lessons]);

  // Update local loading state based on fetcher
  useEffect(() => {
    setIsSubmitting(fetcher.state === 'submitting');
  }, [fetcher.state]);

  // Handle lesson reordering and submit the updated order
  const handleReorder = (updated: LoaderLessonType[]) => {
    if (!canEdit) return;

    setReorderedLessons(updated);

    const orderedData = updated.map((lesson, index) => ({
      id: lesson.id,
      position: index + 1,
    }));

    const formData = new FormData();
    formData.append('intent', 'reorder-lessons');
    formData.append('lessons', JSON.stringify(orderedData));
    formData.append('chapterId', params.chapterId ?? '');

    fetcher.submit(formData, {
      method: 'post',
      action: `/${params.organizationId}/builder/${params.courseId}/content`,
    });
  };

  // Show fallback UI when no lessons exist
  if (reorderedLessons.length === 0) {
    return <NotFoundCard message='No course lessons found' />;
  }

  return (
    <div>
      <Reorder.Group
        axis='y'
        values={reorderedLessons}
        onReorder={handleReorder}
        layoutScroll
        className='select-none'
      >
        <div className='flex w-full flex-col space-y-4'>
          {reorderedLessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <LessonCard key={lesson.id} lesson={lesson} loading={isSubmitting} canEdit />
            </motion.div>
          ))}
        </div>
      </Reorder.Group>
    </div>
  );
}
