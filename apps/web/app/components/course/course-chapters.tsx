import { useEffect, useState } from 'react';
import { useFetcher, useParams } from 'react-router';
import { Reorder } from 'framer-motion';

import { NotFoundCard } from '../cards';
import { Accordion } from '../ui/accordion';
import CourseChapterItem from './course-chapter-item';

import type { CourseChaptersType } from '~/routes/dashboard/courses/course-content';

interface Props {
  chapters: CourseChaptersType;
}

type Chapter = NonNullable<CourseChaptersType>[number];

export function CourseChapters({ chapters }: Props) {
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
      action: `/${params.username}/course-builder/${params.courseId}/content`,
    });
  };

  // Show fallback UI when no chapters exist
  if (reorderedChapters.length === 0) {
    return <NotFoundCard message='No course chapters found' />;
  }

  return (
    <div>
      <Reorder.Group
        axis='y'
        values={reorderedChapters}
        onReorder={handleReorder}
        layoutScroll
        className='select-none'
      >
        <Accordion type='single' collapsible className='flex w-full flex-col space-y-4'>
          {reorderedChapters.map((chapter) => (
            <CourseChapterItem key={chapter.id} chapter={chapter} loading={isSubmitting} />
          ))}
        </Accordion>
      </Reorder.Group>
    </div>
  );
}
