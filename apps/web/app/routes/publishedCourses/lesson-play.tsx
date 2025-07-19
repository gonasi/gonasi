import { useRef } from 'react';
import { Outlet } from 'react-router';
import { redirectWithError } from 'remix-toast';

import {
  fetchLessonBlocksProgress,
  fetchPublishedLessonBlocks,
} from '@gonasi/database/publishedCourses';

import type { Route } from './+types/lesson-play';

import CourseAccessCard from '~/components/cards/course-access-card';
import { CoursePlayLayout } from '~/components/layouts/course/course-play-layout';
import ViewPluginTypesRenderer from '~/components/plugins/PluginRenderers/ViewPluginTypesRenderer';
import { createClient } from '~/lib/supabase/supabase.server';

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
      fetchPublishedLessonBlocks({
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

  const blockRefs = useRef<Record<string, HTMLElement | null>>({});

  if (!hasAccess) {
    return <CourseAccessCard enrollPath={`/c/${params.publishedCourseId}`} />;
  }
  return (
    <>
      <CoursePlayLayout
        to={`/c/${params.publishedCourseId}`}
        basePath={`/c/${params.publishedCourseId}/${params.publishedChapterId}/${params.publishedLessonId}/play`}
        progress={50}
        loading={false}
      >
        <section className='mx-auto max-w-xl px-4 py-10 md:px-0'>
          {lessonAndBlocks && lessonAndBlocks.blocks && lessonAndBlocks.blocks.length ? (
            lessonAndBlocks.blocks.map((block) => {
              return (
                <div
                  key={block.id}
                  ref={(el) => {
                    blockRefs.current[block.id] = el;
                  }}
                  className='scroll-mt-18 md:scroll-mt-22'
                >
                  <ViewPluginTypesRenderer block={block} mode='play' />
                </div>
              );
            })
          ) : (
            <p>no blocks found</p>
          )}
        </section>
        <pre className='overflow-x-auto rounded p-4 text-sm whitespace-pre-wrap'>
          {JSON.stringify(loaderData, null, 2)}
        </pre>
      </CoursePlayLayout>
      <Outlet />
    </>
  );
}
