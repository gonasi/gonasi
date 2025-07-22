import { useRef } from 'react';
import { Outlet, redirect } from 'react-router';
import { dataWithError, redirectWithError } from 'remix-toast';

import { createBlockInteraction } from '@gonasi/database/lessons';
import { fetchPublishedLessonBlocksWithProgress } from '@gonasi/database/publishedCourses';
import { SubmitBlockProgressSchema } from '@gonasi/schemas/publish/progressiveReveal';

import type { Route } from './+types/lesson-play';

import CourseAccessCard from '~/components/cards/course-access-card';
import { useScrollAudio } from '~/components/hooks/useAutoScroll';
import { CoursePlayLayout } from '~/components/layouts/course/course-play-layout';
import ViewPluginTypesRenderer from '~/components/plugins/PluginRenderers/ViewPluginTypesRenderer';
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

    return {
      hasAccess: Boolean(accessResult.data),
      lessonData,
    };
  } catch (error) {
    console.error('Lesson loader error:', error);
    throw error;
  }
}

// --- Lesson Playback Component ---
export default function LessonPlay({ params, loaderData }: Route.ComponentProps) {
  const { hasAccess, lessonData } = loaderData;
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
        </section>
      </CoursePlayLayout>
      <Outlet />
    </>
  );
}
