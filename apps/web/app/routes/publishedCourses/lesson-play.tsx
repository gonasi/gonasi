import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router';
import { redirectWithError } from 'remix-toast';

import {
  fetchLessonBlocksProgress,
  fetchPublishedLessonBlocksWithProgress,
} from '@gonasi/database/publishedCourses';

import type { Route } from './+types/lesson-play';

import CourseAccessCard from '~/components/cards/course-access-card';
import { useScrollAudio } from '~/components/hooks/useAutoScroll';
import { CoursePlayLayout } from '~/components/layouts/course/course-play-layout';
import ViewPluginTypesRenderer from '~/components/plugins/PluginRenderers/ViewPluginTypesRenderer';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

export async function loader({ params, request }: Route.LoaderArgs) {
  try {
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

    // Run both requests in parallel
    const [lessonAndBlocks, progress, accessResult] = await Promise.all([
      fetchPublishedLessonBlocksWithProgress({
        supabase,
        courseId: params.publishedCourseId,
        chapterId: params.publishedChapterId,
        lessonId: params.publishedLessonId,
      }),
      fetchLessonBlocksProgress({
        supabase,
        publishedCourseId: params.publishedCourseId,
        publishedLessonId: params.publishedLessonId,
      }),
      supabase.rpc('user_has_active_access', {
        p_user_id: user.id,
        p_published_course_id: params.publishedCourseId,
      }),
    ]);

    if (accessResult.error) {
      console.error('Error checking course access:', accessResult.error);
    }

    return {
      hasAccess: Boolean(accessResult.data),
      lessonAndBlocks,
      progress,
    };
  } catch (error) {
    throw error;
  }
}

export default function LessonPlay({ params, loaderData }: Route.ComponentProps) {
  const { hasAccess, lessonAndBlocks, progress } = loaderData;

  const { visibleBlocks, initializePlayFlow, lessonProgress, activeBlock } = useStore();

  const blockRefs = useRef<Record<string, HTMLElement | null>>({});

  // Initialize and cleanup on mount/unmount
  useEffect(() => {
    initializePlayFlow({
      lessonBlocks: lessonAndBlocks?.blocks ?? [],
      lessonBlockProgress: progress ?? [],
    });
    return () => {
      useStore.getState().resetPlayFlow();
    };
  }, [initializePlayFlow, lessonAndBlocks?.blocks, progress]);

  // Use the improved scroll audio hook
  useScrollAudio(activeBlock, blockRefs);

  if (!hasAccess) {
    return <CourseAccessCard enrollPath={`/c/${params.publishedCourseId}`} />;
  }

  if (!lessonAndBlocks) {
    return <div>No blocks found</div>;
  }

  return (
    <>
      <CoursePlayLayout
        to={`/c/${params.publishedCourseId}`}
        basePath={`/c/${params.publishedCourseId}/${params.publishedChapterId}/${params.publishedLessonId}/play`}
        progress={lessonProgress}
        loading={false}
      >
        <section className='mx-auto max-w-xl px-4 py-10 md:px-0'>
          {visibleBlocks.length > 0 &&
            visibleBlocks.map((block) => (
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
