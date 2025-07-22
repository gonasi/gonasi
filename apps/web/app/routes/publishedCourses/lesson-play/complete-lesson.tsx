import Confetti from 'react-confetti-boom';
import { redirect } from 'react-router';

import { fetchLessonNavigationIds } from '@gonasi/database/publishedCourses';

import type { Route } from './+types/complete-lesson';

import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [
    {
      title: `Lesson Completed 🎉 • Gonasi`,
    },
    {
      name: 'description',
      content: `🎉 Congratulations! You've completed this lesson. Keep going! 🚀`,
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  try {
    const lessonNavigation = await fetchLessonNavigationIds({
      supabase,
      courseId: params.publishedCourseId,
      lessonId: params.publishedLessonId,
    });

    const currentLesson = lessonNavigation?.current_lesson;

    console.log('courseId: ', params.publishedCourseId, currentLesson?.course_id);
    console.log('chapterId: ', params.publishedChapterId, currentLesson?.chapter_id);
    console.log('lessonId: ', params.publishedLessonId, currentLesson?.lesson_id);
    console.log('nextLessonId: ', params.nextLessonId, lessonNavigation?.next_lesson?.lesson_id);

    // Redirect if any of the params do not match the canonical values
    const canonicalUrl = `/c/${currentLesson?.course_id}/${currentLesson?.chapter_id}/${currentLesson?.lesson_id}/play`;

    if (
      params.publishedCourseId !== currentLesson?.course_id ||
      params.publishedChapterId !== currentLesson?.chapter_id ||
      params.publishedLessonId !== currentLesson?.lesson_id
    ) {
      console.warn('Mismatched lesson URL params, redirecting to canonical URL');
      throw redirect(canonicalUrl);
    }

    return {
      lessonNavigation,
    };
  } catch (error) {
    console.error('Lesson loader error:', error);
    throw error;
  }
}

export default function CompleteLesson() {
  return (
    <>
      <Modal open>
        <Modal.Content size='md'>
          <Modal.Header title='Lesson Complete' closeRoute='' />
          <Modal.Body className='px-4'>
            <h2>completion</h2>
            <Confetti particleCount={100} colors={['#f74d40', '#20c9d0', '#0f172a', '#ffffff']} />
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </>
  );
}
