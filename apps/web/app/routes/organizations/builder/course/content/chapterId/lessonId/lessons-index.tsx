import { useEffect, useState } from 'react';
import { useFetcher } from 'react-router';
import { redirectWithError } from 'remix-toast';

import { fetchLessonsByChapter } from '@gonasi/database/lessons';

import type { Route } from './+types/lessons-index';

import { CourseLessons } from '~/components/course/course-lessons';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

type LoaderData = Awaited<ReturnType<typeof loader>>;

type LoaderObjectData = Exclude<LoaderData, Response>;

export type LoaderLessonType = LoaderObjectData['lessons'][number];

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [result, canEditResult] = await Promise.all([
    fetchLessonsByChapter({
      supabase,
      chapterId: params.chapterId,
      organizationId: params.organizationId,
    }),
    supabase.rpc('can_user_edit_course', {
      arg_course_id: params.courseId,
    }),
  ]);

  if (!result) {
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/content`,
      'Lessons not found',
    );
  }

  return {
    lessons: result?.lessons,
    chapter: result?.chapter,
    canEdit: canEditResult.data ?? false,
  };
}

export default function ViewAllChapterLessonsModal({ params, loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();

  const [reorderedLessons, setReorderedLessons] = useState<LoaderLessonType[]>(
    loaderData?.lessons ?? [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setReorderedLessons(loaderData?.lessons ?? []);
  }, [loaderData?.lessons]);

  useEffect(() => {
    setIsSubmitting(fetcher.state === 'submitting');
  }, [fetcher.state]);

  const handleLessonReorder = (updated: LoaderLessonType[]) => {
    // if (!canEdit) return;

    setReorderedLessons(updated);

    const orderedData = updated.map((lesson, index) => ({
      id: lesson.id,
      position: index + 1,
    }));

    const formData = new FormData();
    formData.append('intent', 'reorder-lessons');
    formData.append('lessons', JSON.stringify(orderedData));
    formData.append('chapterId', params.chapterId);

    fetcher.submit(formData, {
      method: 'post',
      action: `/${params.organizationId}/builder/${params.courseId}/content`,
    });
  };

  return (
    <Modal open>
      <Modal.Content size='lg'>
        <Modal.Header
          title={loaderData?.chapter.name}
          closeRoute={`/${params.organizationId}/builder/${params.courseId}/content`}
        />
        <Modal.Body>
          <CourseLessons lessons={loaderData.lessons} canEdit={loaderData.canEdit} />
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
