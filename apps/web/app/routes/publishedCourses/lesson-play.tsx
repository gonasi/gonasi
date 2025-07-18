import { Outlet } from 'react-router';
import { redirectWithError } from 'remix-toast';

import { fetchPublishedLessonBlocks } from '@gonasi/database/publishedCourses';

import type { Route } from './+types/lesson-play';

import { CoursePlayLayout } from '~/components/layouts/course/course-play-layout';
import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ params, request }: Route.LoaderArgs) {
  try {
    const { supabase } = createClient(request);

    const lessonAndBlocks = await fetchPublishedLessonBlocks({
      supabase,
      courseId: params.publishedCourseId,
      chapterId: params.publishedChapterId,
      lessonId: params.publishedLessonId,
    });

    if (!lessonAndBlocks) {
      return redirectWithError(
        `/c/${params.publishedCourseId}`,
        'Lesson not found or you are currently not enrolled to this course',
      );
    }

    return { lessonAndBlocks };
  } catch (error) {
    throw error;
  }
}

export default function LessonPlay({ params, loaderData }: Route.ComponentProps) {
  return (
    <>
      <CoursePlayLayout
        to={`/c/${params.publishedCourseId}`}
        basePath={`/c/${params.publishedCourseId}/${params.publishedChapterId}/${params.publishedLessonId}/play`}
        progress={50}
        loading={false}
      >
        <pre className='overflow-x-auto rounded p-4 text-sm whitespace-pre-wrap'>
          {JSON.stringify(loaderData, null, 2)}
        </pre>
      </CoursePlayLayout>
      <Outlet />
    </>
  );
}
