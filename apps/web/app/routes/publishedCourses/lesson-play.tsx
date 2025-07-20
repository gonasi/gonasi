import { useRef } from 'react';
import { Outlet } from 'react-router';
import { redirectWithError } from 'remix-toast';

import { fetchPublishedLessonBlocksWithProgress } from '@gonasi/database/publishedCourses';

import type { Route } from './+types/lesson-play';

import CourseAccessCard from '~/components/cards/course-access-card';
import { useScrollAudio } from '~/components/hooks/useAutoScroll';
import { CoursePlayLayout } from '~/components/layouts/course/course-play-layout';
import ViewPluginTypesRenderer from '~/components/plugins/PluginRenderers/ViewPluginTypesRenderer';
import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectTo = `/c/${params.publishedCourseId}/${params.publishedChapterId}/${params.publishedLessonId}/play`;

  if (!user) {
    return redirectWithError(
      `/login?redirectTo=${encodeURIComponent(redirectTo)}`,
      'Please log in to access this lesson.',
    );
  }

  try {
    const [lessonContentResult, accessCheckResult] = await Promise.all([
      fetchPublishedLessonBlocksWithProgress({
        supabase,
        courseId: params.publishedCourseId,
        chapterId: params.publishedChapterId,
        lessonId: params.publishedLessonId,
      }),
      supabase.rpc('user_has_active_access', {
        p_user_id: user.id,
        p_published_course_id: params.publishedCourseId,
      }),
    ]);

    return {
      hasAccess: Boolean(accessCheckResult.data),
      blocksAndProgress: lessonContentResult,
    };
  } catch (error) {
    console.error('Lesson loader error:', error);
    throw error;
  }
}

export default function LessonPlay({ params, loaderData }: Route.ComponentProps) {
  const { hasAccess, blocksAndProgress } = loaderData;
  const blockRefs = useRef<Record<string, HTMLElement | null>>({});

  useScrollAudio(blocksAndProgress?.lesson_progress?.next_action?.block_id ?? null, blockRefs);

  if (!hasAccess) {
    return <CourseAccessCard enrollPath={`/c/${params.publishedCourseId}`} />;
  }

  if (!blocksAndProgress) {
    return <div>No lesson data found.</div>;
  }

  return (
    <>
      <CoursePlayLayout
        to={`/c/${params.publishedCourseId}`}
        basePath={`/c/${params.publishedCourseId}/${params.publishedChapterId}/${params.publishedLessonId}/play`}
        progress={blocksAndProgress.lesson_progress?.completion_percentage}
        loading={false}
      >
        <section className='mx-auto max-w-xl px-4 py-10 md:px-0'>
          {blocksAndProgress.blocks
            .filter((block) => block.is_visible)
            .map((block) => (
              <div
                key={block.id}
                ref={(el) => {
                  blockRefs.current[block.id] = el;
                }}
                className='scroll-mt-18 md:scroll-mt-22'
              >
                <ViewPluginTypesRenderer block={block} mode='play' />
              </div>
            ))}
        </section>
      </CoursePlayLayout>
      <Outlet />
    </>
  );
}
