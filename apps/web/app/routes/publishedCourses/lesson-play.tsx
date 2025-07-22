import { Suspense, useRef } from 'react';
import { Await, Outlet, redirect, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { dataWithError, redirectWithError } from 'remix-toast';

import { createBlockInteraction } from '@gonasi/database/lessons';
import {
  fetchLessonNavigationIds,
  fetchPublishedLessonBlocksWithProgress,
} from '@gonasi/database/publishedCourses';
import { SubmitBlockProgressSchema } from '@gonasi/schemas/publish/progressiveReveal';

import type { Route } from './+types/lesson-play';

import CourseAccessCard from '~/components/cards/course-access-card';
import { useScrollAudio } from '~/components/hooks/useAutoScroll';
import { CoursePlayLayout } from '~/components/layouts/course/course-play-layout';
import ViewPluginTypesRenderer from '~/components/plugins/PluginRenderers/ViewPluginTypesRenderer';
import { OutlineButton } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';

// Framer Motion animation for nudge effect on the call-to-action button
const nudgeAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: [0, -4, 0],
    transition: {
      opacity: { delay: 1, duration: 0.3, ease: 'easeOut' },
      y: {
        duration: 1.2,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
      },
    },
  },
};

// --- Metadata Configuration ---
export function meta({ data }: Route.MetaArgs) {
  const metadata = data?.lessonData?.metadata;
  const hasAccess = data?.hasAccess;

  if (!hasAccess) {
    return [
      { title: 'Unlock This Lesson • Gonasi' },
      {
        name: 'description',
        content:
          'You need to enroll to access this interactive lesson. Join the course on Gonasi and start learning today.',
      },
    ];
  }

  if (!metadata) {
    return [
      { title: 'Lesson Not Found • Gonasi' },
      {
        name: 'description',
        content:
          'This lesson could not be found. Explore other engaging, interactive courses on Gonasi.',
      },
    ];
  }

  const { completion_percentage, total_blocks, completed_blocks } = metadata;

  return [
    {
      title: `Lesson Progress • ${completed_blocks}/${total_blocks} Completed • Gonasi`,
    },
    {
      name: 'description',
      content: `You've completed ${completion_percentage}% of this interactive lesson. Continue learning with Gonasi.`,
    },
  ];
}

// --- Action Handler for Submitting Block Interaction ---
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const { supabase } = createClient(request);

  const isLastInteraction = formData.get('isLast') === 'true';
  const payloadString = formData.get('payload');

  if (typeof payloadString !== 'string') {
    return dataWithError(null, 'Missing or invalid payload data');
  }

  const parsedPayload = JSON.parse(payloadString);
  console.log('Payload Received:', parsedPayload);

  const validation = SubmitBlockProgressSchema.safeParse(parsedPayload);
  if (!validation.success) {
    return dataWithError(null, 'Payload does not match required structure', { status: 400 });
  }

  try {
    const result = await createBlockInteraction({
      supabase,
      data: {
        ...validation.data,
        chapter_id: params.publishedChapterId,
        lesson_id: params.publishedLessonId,
        published_course_id: params.publishedCourseId,
      },
    });

    if (!result.success) {
      return dataWithError(null, result.message, { status: 400 });
    }

    if (isLastInteraction) {
      // TODO: Redirect to completed page once it's ready
      return redirect('/go/course');
    }

    console.log('result: ', result.data);
    return true;
  } catch (err) {
    console.error(`Failed to process interaction:`, err);
    const message =
      err instanceof Error
        ? err.message
        : 'An unexpected error occurred while processing the interaction';
    return dataWithError(null, message, { status: 500 });
  }
}

// --- Loader for Lesson Content + Access Check ---
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
    const [lessonData, accessResult] = await Promise.all([
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

    const lessonNavigationPromise = fetchLessonNavigationIds({
      supabase,
      courseId: params.publishedCourseId,
      lessonId: params.publishedLessonId,
    });

    return {
      hasAccess: Boolean(accessResult.data),
      lessonData,
      lessonNavigationPromise,
    };
  } catch (error) {
    console.error('Lesson loader error:', error);
    throw error;
  }
}

// --- Lesson Playback Component ---
export default function LessonPlay({ params, loaderData }: Route.ComponentProps) {
  const { hasAccess, lessonData, lessonNavigationPromise } = loaderData;

  const navigate = useNavigate();
  const blockRefs = useRef<Record<string, HTMLElement | null>>({});

  useScrollAudio(lessonData?.metadata.active_block_id ?? null, blockRefs);

  if (!hasAccess) {
    return <CourseAccessCard enrollPath={`/c/${params.publishedCourseId}`} />;
  }

  if (!lessonData) {
    return <div>No lesson data found.</div>;
  }

  return (
    <>
      <CoursePlayLayout
        to={`/c/${params.publishedCourseId}`}
        basePath={`/c/${params.publishedCourseId}/${params.publishedChapterId}/${params.publishedLessonId}/play`}
        progress={lessonData.metadata.completion_percentage}
        loading={false}
      >
        <section className='mx-auto max-w-xl px-4 py-10 md:px-0'>
          {lessonData.blocks
            .filter((block) => block.is_visible)
            .map((block) => (
              <div
                key={block.block.id}
                ref={(el) => {
                  blockRefs.current[block.block.id] = el;
                }}
                className='scroll-mt-18 md:scroll-mt-22'
              >
                <ViewPluginTypesRenderer mode='play' blockWithProgress={block} />
              </div>
            ))}

          <Suspense fallback={<LoaderCircle className='animate-spin' />}>
            <Await
              resolve={lessonNavigationPromise}
              errorElement={
                <div className='text-muted-foreground text-center text-sm'>
                  We couldn’t load the next lesson right now.
                </div>
              }
            >
              {(navigationData) => {
                if (!navigationData) return null;

                const { is_course_complete } = navigationData.course_info ?? {};
                if (is_course_complete) return null;

                const nextLessonTarget =
                  navigationData.continue_course ?? navigationData.next_lesson;

                if (!nextLessonTarget) return null;

                const { course_id, chapter_id, lesson_id } = nextLessonTarget;

                const isSameChapter = chapter_id === params.publishedChapterId;

                const ctaButtonLabel =
                  navigationData.continue_course?.is_different_from_next === true
                    ? 'Pick up where you left off'
                    : isSameChapter
                      ? 'Go to next lesson'
                      : 'Keep going to next chapter';

                return (
                  <div className='fixed right-4 bottom-10 container flex w-full justify-end'>
                    <motion.div initial={nudgeAnimation.initial} animate={nudgeAnimation.animate}>
                      <OutlineButton
                        type='button'
                        className='bg-card/80 rounded-full shadow-lg'
                        onClick={() => navigate(`/c/${course_id}/${chapter_id}/${lesson_id}/play`)}
                        rightIcon={<ArrowRight />}
                      >
                        {ctaButtonLabel}
                      </OutlineButton>
                    </motion.div>
                  </div>
                );
              }}
            </Await>
          </Suspense>
        </section>
      </CoursePlayLayout>
      <Outlet />
    </>
  );
}
