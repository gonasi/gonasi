import { Suspense, useRef } from 'react';
import { Await, Outlet, redirect } from 'react-router';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LoaderCircle,
  PlayCircle,
} from 'lucide-react';
import { dataWithError, redirectWithError } from 'remix-toast';

import { createBlockInteraction } from '@gonasi/database/lessons';
import {
  fetchPublishedLessonBlocksWithProgress,
  getUnifiedNavigation,
} from '@gonasi/database/publishedCourses';
import { SubmitBlockProgressSchema } from '@gonasi/schemas/publish/progressiveReveal';

import type { Route } from './+types/lesson-play-index';

import CourseAccessCard from '~/components/cards/course-access-card';
import { useScrollAudio } from '~/components/hooks/useAutoScroll';
import { CoursePlayLayout } from '~/components/layouts/course/course-play-layout';
import ViewPluginTypesRenderer from '~/components/plugins/PluginRenderers/ViewPluginTypesRenderer';
import { IconNavLink } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';

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

    const navigation = result.data?.navigation;

    if (isLastInteraction && navigation) {
      const { lesson, chapter, course } = navigation.current;

      if (result.data?.navigation.completion.course.is_complete) {
        return redirect(`/c/${params.publishedCourseId}/complete`);
      }

      if (chapter?.is_completed) {
        return redirect(
          `/c/${params.publishedCourseId}/complete/${navigation.current.chapter?.id}`,
        );
      }

      if (lesson?.is_completed) {
        return redirect(
          `/c/${course.id}/${params.publishedChapterId}/${params.publishedLessonId}/play/${navigation.continue.lesson?.id}/complete`,
        );
      }
    }

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

export type LessonNavigationPromise = ReturnType<typeof getUnifiedNavigation>;

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

    const lessonNavigationPromise = getUnifiedNavigation({
      supabase,
      courseId: params.publishedCourseId,
      chapterId: params.publishedChapterId,
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
        segments={lessonData.blocks.map((blockItem) => ({
          id: blockItem.block.id,
          weight: blockItem.block.settings.weight,
          is_complete: blockItem.block_progress?.is_completed ?? false,
        }))}
        activeBlockId={lessonData?.metadata.active_block_id ?? undefined}
        loading={false}
        lessonNavigationPromise={lessonNavigationPromise}
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
                  {`We couldn't load the next lesson right now.`}
                </div>
              }
            >
              {(navigationData) => {
                if (!navigationData) return null;
                // Handle completed courses - still show previous lesson navigation
                if (navigationData.current?.lesson?.is_completed) {
                  const shouldPulse = !!navigationData.continue.lesson;

                  return (
                    <nav className='bg-background/95 border-border/5 fixed right-0 bottom-0 left-0 h-16 border-t backdrop-blur-sm md:h-20'>
                      <div className='container mx-auto h-full px-4 md:px-0'>
                        <div className='flex h-full items-center justify-between space-x-2'>
                          {/* Previous Chapter */}
                          <IconNavLink
                            to={`/c/${navigationData.previous.chapter?.course_id}?navChapter=${navigationData.previous.chapter?.id}`}
                            icon={ChevronsLeft}
                            label='Previous Chapter'
                            hideLabelOnMobile
                            disabled={!navigationData.previous.chapter}
                          />

                          {/* Previous Lesson */}
                          <IconNavLink
                            to={`/c/${navigationData.previous.lesson?.course_id}/${navigationData.previous.lesson?.chapter_id}/${navigationData.previous.lesson?.id}/play`}
                            icon={ChevronLeft}
                            label='Previous Lesson'
                            hideLabelOnMobile
                            disabled={!navigationData.previous.lesson}
                          />

                          {/* Play/Continue Button - Primary Action */}
                          <IconNavLink
                            to={
                              shouldPulse
                                ? `/c/${navigationData.continue.lesson?.course_id}/${navigationData.continue.lesson?.chapter_id}/${navigationData.continue.lesson?.id}/play`
                                : '#'
                            }
                            icon={PlayCircle}
                            label='Continue Learning'
                            hideLabelOnMobile
                            disabled={!shouldPulse}
                            shouldPulse={shouldPulse}
                            size={26}
                          />

                          {/* Next Lesson */}
                          <IconNavLink
                            to={`/c/${navigationData.next.lesson?.course_id}/${navigationData.next.lesson?.chapter_id}/${navigationData.next.lesson?.id}/play`}
                            icon={ChevronRight}
                            label='Next Lesson'
                            hideLabelOnMobile
                            disabled={!navigationData.next.lesson}
                          />

                          {/* Next Chapter */}
                          <IconNavLink
                            to={`/c/${navigationData.next.chapter?.course_id}?navChapter=${navigationData.next.chapter?.id}`}
                            icon={ChevronsRight}
                            label='Next Chapter'
                            hideLabelOnMobile
                            disabled={!navigationData.next.chapter}
                          />
                        </div>
                      </div>
                    </nav>
                  );
                }
                return null;
              }}
            </Await>
          </Suspense>
        </section>
      </CoursePlayLayout>
      <Outlet />
    </>
  );
}
