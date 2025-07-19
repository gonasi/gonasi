import { useRef } from 'react';
import { Outlet } from 'react-router';
import { redirectWithError } from 'remix-toast';

import { fetchPublishedLessonBlocksWithProgress } from '@gonasi/database/publishedCourses';

import type { Route } from './+types/lesson-play';

import CourseAccessCard from '~/components/cards/course-access-card';
import { CoursePlayLayout } from '~/components/layouts/course/course-play-layout';
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

    // Fetch lesson content and access in parallel
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
  } catch (err) {
    console.error('Loader failed:', err);
    throw err;
  }
}

export default function LessonPlay({ params, loaderData }: Route.ComponentProps) {
  const { hasAccess, blocksAndProgress } = loaderData;

  const blockRefs = useRef<Record<string, HTMLElement | null>>({});

  // Use the improved scroll audio hook
  // useScrollAudio(activeBlock, blockRefs);

  if (!hasAccess) {
    return <CourseAccessCard enrollPath={`/c/${params.publishedCourseId}`} />;
  }

  if (!blocksAndProgress) {
    return <div>No blocks found</div>;
  }

  return (
    <>
      <CoursePlayLayout
        to={`/c/${params.publishedCourseId}`}
        basePath={`/c/${params.publishedCourseId}/${params.publishedChapterId}/${params.publishedLessonId}/play`}
        progress={50}
        loading={false}
      >
        <pre className='overflow-y-auto rounded-lg p-4 text-sm break-words whitespace-pre-wrap'>
          {JSON.stringify(blocksAndProgress, null, 2)}
        </pre>

        <section className='mx-auto max-w-xl px-4 py-10 md:px-0'>
          {/* {visibleBlocks.length > 0 &&
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
            ))} */}
        </section>
      </CoursePlayLayout>
      <Outlet />
    </>
  );
}
