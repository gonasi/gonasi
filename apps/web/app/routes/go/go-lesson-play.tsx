import { Outlet } from 'react-router';
import { redirectWithError } from 'remix-toast';

import { fetchNextChapterAndLessonId } from '@gonasi/database/courses';
import { fetchPublishedLessonContentById } from '@gonasi/database/lessons';

import type { Route } from './+types/go-lesson-play';

import { CoursePlayLayout } from '~/components/layouts/course';
import { createClient } from '~/lib/supabase/supabase.server';

// Load the editor component lazily to improve initial load time

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

/**
 * Loader function to fetch lesson content by ID.
 * Redirects to course page if the lesson is not found.
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // Fetch data in parallel
  const [lesson, nextChapterAndLessonId] = await Promise.all([
    fetchPublishedLessonContentById(supabase, params.lessonId),
    fetchNextChapterAndLessonId(supabase, params.courseId, params.chapterId, params.lessonId),
  ]);

  if (!lesson) {
    return redirectWithError(`/go/courses/${params.courseId}`, 'Lesson not found');
  }

  if (!lesson.content) {
    return redirectWithError(`/go/courses/${params.courseId}`, 'Lesson has no content');
  }

  return { lesson, nextChapterAndLessonId };
}

/**
 * Component to display the lesson content using LazyGoEditor.
 * Optimized to prevent unnecessary re-renders.
 */
export default function GoLessonPlay({ params }: Route.ComponentProps) {
  return (
    <>
      <CoursePlayLayout to={`/go/courses/${params.courseId}`} progress={10} />
      <Outlet />
    </>
  );
}
