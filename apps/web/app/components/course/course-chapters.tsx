import { useEffect, useState } from 'react';
import { useFetcher, useParams } from 'react-router';
import { motion, Reorder } from 'framer-motion';

import { NotFoundCard } from '../cards';
import CourseChapterItem from './course-chapter-item';

import type { CourseChaptersType } from '~/routes/dashboard/courses/course-content';

interface Props {
  chapters: CourseChaptersType;
  canEdit: boolean;
}

type Chapter = NonNullable<CourseChaptersType>[number];

export function CourseChapters({ chapters, canEdit }: Props) {
  const fetcher = useFetcher();
  const params = useParams();

  const [reorderedChapters, setReorderedChapters] = useState<Chapter[]>(chapters ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update local state when `chapters` prop changes
  useEffect(() => {
    setReorderedChapters(chapters ?? []);
  }, [chapters]);

  // Track fetcher state to show loading status
  useEffect(() => {
    setIsSubmitting(fetcher.state === 'submitting');
  }, [fetcher.state]);

  // Handle chapter reordering and submit new order
  const handleReorder = (updated: Chapter[]) => {
    if (!canEdit) return;

    setReorderedChapters(updated);

    const orderedData = updated.map((chapter, index) => ({
      id: chapter.id,
      position: index + 1,
    }));

    const formData = new FormData();
    formData.append('intent', 'reorder-chapters');
    formData.append('chapters', JSON.stringify(orderedData));

    fetcher.submit(formData, {
      method: 'post',
      action: `/${params.organizationId}/builder/${params.courseId}/content`,
    });
  };

  // Show fallback UI when no chapters exist
  if (reorderedChapters.length === 0) {
    return <NotFoundCard message='No course chapters found' />;
  }

  return (
    <div className='pl-4'>
      <Reorder.Group
        axis='y'
        values={reorderedChapters}
        onReorder={handleReorder}
        layoutScroll
        className='select-none'
      >
        <div className='flex w-full flex-col space-y-4'>
          {reorderedChapters.map((chapter, index) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <CourseChapterItem chapter={chapter} loading={isSubmitting} canEdit={canEdit} />
            </motion.div>
          ))}
        </div>
      </Reorder.Group>
    </div>
  );
}
