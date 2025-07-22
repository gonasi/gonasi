import Confetti from 'react-confetti-boom';
import { redirect } from 'react-router';

import {
  fetchLessonNavigationIds,
  fetchLessonOverviewWithChapterProgress,
} from '@gonasi/database/publishedCourses';

import type { Route } from './+types/complete-lesson';

import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta({ data }: Route.MetaArgs) {
  const lesson = data?.overviewData?.lesson;
  const chapter = data?.overviewData?.chapter;
  const courseInfo = data?.navigationData?.course_info;

  const lessonName = lesson?.name ?? 'Lesson';
  const chapterName = chapter?.name ?? 'Chapter';
  const courseProgress = courseInfo
    ? `${courseInfo.completed_lessons}/${courseInfo.total_lessons} lessons completed`
    : 'Lesson completed';

  const isCourseComplete = courseInfo?.is_course_complete ?? false;

  return [
    {
      title: `🎉  ${lessonName} Completed • Gonasi`,
    },
    {
      name: 'description',
      content: isCourseComplete
        ? `🎓 You've completed the course! This lesson, "${lessonName}" in ${chapterName}, was your final step. Bravo! 🚀`
        : `🎉 You've completed "${lessonName}" in ${chapterName}. ${courseProgress}. Keep going strong! 💪`,
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  try {
    const [navigationData, overviewData] = await Promise.all([
      fetchLessonNavigationIds({
        supabase,
        courseId: params.publishedCourseId,
        lessonId: params.publishedLessonId,
      }),
      fetchLessonOverviewWithChapterProgress({
        supabase,
        courseId: params.publishedCourseId,
        lessonId: params.publishedLessonId,
      }),
    ]);

    const currentLesson = navigationData?.current_lesson;

    // Redirect if URL params are not canonical
    const canonicalLessonUrl = `/c/${currentLesson?.course_id}/${currentLesson?.chapter_id}/${currentLesson?.lesson_id}/play`;

    const isNonCanonical =
      params.publishedCourseId !== currentLesson?.course_id ||
      params.publishedChapterId !== currentLesson?.chapter_id ||
      params.publishedLessonId !== currentLesson?.lesson_id;

    if (isNonCanonical) {
      console.warn('Non-canonical lesson URL, redirecting to canonical URL');
      throw redirect(canonicalLessonUrl);
    }

    return {
      navigationData,
      overviewData,
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
