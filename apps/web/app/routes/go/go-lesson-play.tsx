import { lazy, useEffect, useRef } from 'react';
import { Outlet, redirect } from 'react-router';
import { dataWithError, dataWithSuccess, redirectWithError } from 'remix-toast';

import {
  createBlockInteraction,
  fetchUserLessonBlockInteractions,
  fetchValidatedPublishedLessonById,
  resetBlockInteractionsByLesson,
} from '@gonasi/database/lessons';
import type { Interaction } from '@gonasi/schemas/plugins';

import type { Route } from './+types/go-lesson-play';

import { CoursePlayLayout } from '~/components/layouts/course';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

const ViewPluginTypesRenderer = lazy(() => import('~/components/plugins/viewPluginTypesRenderer'));

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createClient(request);

  // Parse form data from the request
  const formData = await request.formData();
  const intent = formData.get('intent');
  const isLast = formData.get('isLast') === 'true';

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
        const { success, message } = await createBlockInteraction(supabase, payload);

        if (!success) {
          return dataWithError(null, message, { status: 400 });
        }

        if (isLast) {
          return redirect(`/go/course/${courseId}/${chapterId}/${lessonId}/play/completed`);
        }
        return true;
      }

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
  const { visibleBlocks, initializePlayFlow, lessonProgress, activeBlock } = useStore();

  const blockRefs = useRef<Record<string, HTMLElement | null>>({});

  const {
    lesson: { blocks },
    blockInteractions,
  } = loaderData;

  useEffect(() => {
    // Initialize the play flow when component mounts
    initializePlayFlow(blocks, blockInteractions);

    // Clean up when component unmounts
    return () => {
      useStore.getState().resetPlayFlow();
    };
  }, [blockInteractions, blocks, initializePlayFlow]);

  useEffect(() => {
    if (activeBlock) {
      blockRefs.current[activeBlock]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [activeBlock]);

  if (!visibleBlocks) return null;

  return (
    <>
      <CoursePlayLayout
        to={`/go/courses/${params.courseId}`}
        progress={lessonProgress}
        loading={false}
      >
        <section className='mx-auto min-h-screen max-w-xl px-4 py-10 md:px-0'>
          {visibleBlocks?.length > 0
            ? visibleBlocks.map((block) => (
                <div
                  key={block.id}
                  ref={(el) => {
                    blockRefs.current[block.id] = el;
                  }}
                  className='scroll-mt-24'
                >
                  <ViewPluginTypesRenderer block={block} mode='play' />
                </div>
              ))
            : null}
        </section>
      </CoursePlayLayout>
      <Outlet />
    </>
  );
}
