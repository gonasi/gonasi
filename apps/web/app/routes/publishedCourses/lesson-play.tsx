import { Outlet } from 'react-router';

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

    console.log('LESSON: ', lessonAndBlocks);

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
        <h2>hey</h2>
      </CoursePlayLayout>
      <Outlet />
    </>
  );
}
