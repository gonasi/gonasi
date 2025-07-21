import { useRef } from 'react';
import { Outlet } from 'react-router';
import { dataWithError, dataWithSuccess, redirectWithError } from 'remix-toast';

import { fetchPublishedLessonBlocksWithProgress } from '@gonasi/database/publishedCourses';
import { SubmitBlockProgressSchema } from '@gonasi/schemas/publish/progressiveReveal';

import type { Route } from './+types/lesson-play';

import CourseAccessCard from '~/components/cards/course-access-card';
import { useScrollAudio } from '~/components/hooks/useAutoScroll';
import { CoursePlayLayout } from '~/components/layouts/course/course-play-layout';
import ViewPluginTypesRenderer from '~/components/plugins/PluginRenderers/ViewPluginTypesRenderer';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta({ data }: Route.MetaArgs) {
  const metadata = data?.lessonData?.metadata;
  const hasAccess = data?.hasAccess;

  if (!hasAccess) {
    return [
      {
        title: 'Unlock This Lesson • Gonasi',
      },
      {
        name: 'description',
        content:
          'You need to enroll to access this interactive lesson. Join the course on Gonasi and start learning today.',
      },
    ];
  }

  if (!metadata) {
    return [
      {
        title: 'Lesson Not Found • Gonasi',
      },
      {
        name: 'description',
        content:
          'This lesson could not be found. Explore other engaging, interactive courses on Gonasi.',
      },
    ];
  }

  const completion = metadata.completion_percentage;
  const totalBlocks = metadata.total_blocks;
  const completedBlocks = metadata.completed_blocks;

  return [
    {
      title: `Lesson Progress • ${completedBlocks}/${totalBlocks} Completed • Gonasi`,
    },
    {
      name: 'description',
      content: `You've completed ${completion}% of this interactive lesson. Continue learning with Gonasi.`,
    },
  ];
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const { supabase } = createClient(request);

  const isLastInteraction = formData.get('isLast') === 'true';

  const payloadValue = formData.get('payload');

  if (typeof payloadValue !== 'string') {
    return dataWithError(null, 'Missing or invalid payload data');
  }

  const interactionPayload = JSON.parse(payloadValue);
  console.log('Payload Received:', interactionPayload);

  // Validate against base interaction schema
  const baseSchemaValidation = SubmitBlockProgressSchema.safeParse(interactionPayload);

  if (!baseSchemaValidation.success) {
    return dataWithError(null, 'Payload does not match required structure', { status: 400 });
  }

  try {
    return dataWithSuccess(null, 'submit worked');
    // const { success: recordSuccess, message: recordMessage } = await createBlockInteraction(
    //   supabase,
    //   baseSchemaValidation.data,
    // );

    // if (!recordSuccess) {
    //   return dataWithError(null, recordMessage, { status: 400 });
    // }

    // if (isLastInteraction) {
    //   return redirect(`/go/course/${courseId}/${chapterId}/${lessonId}/play/completed`);
    // }
  } catch (unexpectedError) {
    console.error(`Failed to process  interaction:`, unexpectedError);
    const errorMessage =
      unexpectedError instanceof Error
        ? unexpectedError.message
        : 'An unexpected error occurred while processing the interaction';
    return dataWithError(null, errorMessage, { status: 500 });
  }
}

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

export default function LessonPlay({ params, loaderData }: Route.ComponentProps) {
  const { hasAccess, lessonData } = loaderData;

  // Refs used for scroll targeting of specific lesson blocks
  const blockElementRefs = useRef<Record<string, HTMLElement | null>>({});

  useScrollAudio(lessonData?.metadata.active_block_id ?? null, blockElementRefs);

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
            .filter((blockItem) => blockItem.is_visible)
            .map((blockItem) => (
              <div
                key={blockItem.block.id}
                ref={(element) => {
                  blockElementRefs.current[blockItem.block.id] = element;
                }}
                className='scroll-mt-18 md:scroll-mt-22'
              >
                <ViewPluginTypesRenderer mode='play' blockWithProgress={blockItem} />
              </div>
            ))}
        </section>
      </CoursePlayLayout>
      <Outlet />
    </>
  );
}
