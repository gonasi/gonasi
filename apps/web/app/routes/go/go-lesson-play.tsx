import { lazy, memo, Suspense, useEffect, useState } from 'react';
import { Outlet, useFetcher } from 'react-router';
import { dataWithError, dataWithSuccess, redirectWithError } from 'remix-toast';

import {
  createBlockInteraction,
  fetchUserLessonBlockInteractions,
  fetchValidatedPublishedLessonById,
  resetBlockInteractionsByLesson,
} from '@gonasi/database/lessons';
import type { Interaction } from '@gonasi/schemas/plugins';

import type { Route } from './+types/go-lesson-play';
import type { LessonBlockLoaderReturnType } from '../dashboard/courses/lessons/edit-plugin-modal';

import { CoursePlayLayout } from '~/components/layouts/course';
import { Spinner } from '~/components/loaders';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

const ViewPluginTypesRenderer = lazy(() => import('~/components/plugins/viewPluginTypesRenderer'));

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

const BlockRenderer = memo(function BlockRenderer({
  block,
}: {
  block: LessonBlockLoaderReturnType;
}) {
  return (
    <Suspense fallback={<Spinner />}>
      <ViewPluginTypesRenderer block={block} mode='play' />
    </Suspense>
  );
});

export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createClient(request);

  // Parse form data from the request
  const formData = await request.formData();
  const intent = formData.get('intent');

  // Validate 'intent' value
  if (typeof intent !== 'string') {
    return dataWithError(null, 'Invalid or missing intent', { status: 400 });
  }

  try {
    // Extract common params for reuse
    const { courseId, chapterId, lessonId } = params;

    switch (intent) {
      case 'resetLessonProgress': {
        const { success, message } = await resetBlockInteractionsByLesson(supabase, lessonId);

        return success ? dataWithSuccess(null, message) : dataWithError(null, message);
      }

      case 'addBlockInteraction': {
        const rawPayload = formData.get('payload');

        // Validate 'payload' value
        if (typeof rawPayload !== 'string') {
          return dataWithError(null, 'Invalid or missing payload', { status: 400 });
        }

        let payload: Interaction;

        try {
          payload = JSON.parse(rawPayload);
        } catch {
          throw new Response('Failed to parse payload', { status: 400 });
        }

        const { supabase } = createClient(request);
        await createBlockInteraction(supabase, payload);

        return true;
      }

      // case 'completeLesson': {
      //   const { success, message } = await completeLessonByUser(
      //     supabase,
      //     courseId,
      //     chapterId,
      //     lessonId,
      //   );

      //   if (!success) {
      //     return dataWithError(null, message, { status: 400 });
      //   }

      //   return redirect(`/go/course/${courseId}/${chapterId}/${lessonId}/completed`);
      // }

      default:
        return dataWithError(null, `Unknown intent: ${intent}`, { status: 400 });
    }
  } catch (error) {
    console.error(`Error processing intent "${intent}":`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return dataWithError(null, errorMessage, { status: 500 });
  }
}

export type GoLessonPlayInteractionReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['blockInteractions'];

export type GoLessonPlayLessonType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['lesson'];

export type GoLessonPlayLessonBlocksType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['lesson']['blocks'];

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [lesson, blockInteractions] = await Promise.all([
    fetchValidatedPublishedLessonById(supabase, params.lessonId),
    fetchUserLessonBlockInteractions({
      supabase,
      lessonId: params.lessonId,
    }),
  ]);

  if (!lesson) {
    return redirectWithError(`/go/courses/${params.courseId}`, 'Lesson not found');
  }

  return { lesson, blockInteractions };
}

export default function GoLessonPlay({ loaderData, params }: Route.ComponentProps) {
  const fetcher = useFetcher();

  const { visibleBlocks, initializePlayFlow, lessonProgress } = useStore();

  console.log('lessonProgress: ', lessonProgress);

  const {
    lesson: { blocks },
    blockInteractions,
  } = loaderData;

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(fetcher.state === 'submitting');
  }, [fetcher.state]);

  useEffect(() => {
    // Initialize the play flow when component mounts
    initializePlayFlow(blocks, blockInteractions);

    // Clean up when component unmounts
    return () => {
      useStore.getState().resetPlayFlow();
    };
  }, [blockInteractions, blocks, initializePlayFlow]);

  if (!visibleBlocks) return null;

  return (
    <>
      <CoursePlayLayout
        to={`/go/courses/${params.courseId}`}
        progress={lessonProgress}
        loading={loading}
      />
      <section className='mx-auto flex max-w-xl flex-col space-y-8 px-4 py-10 md:px-0'>
        {visibleBlocks?.length > 0
          ? visibleBlocks.map((block) => <BlockRenderer key={block.id} block={block} />)
          : null}
      </section>
      <div>{loading ? <Spinner /> : null}</div>
      <Outlet />
    </>
  );
}
