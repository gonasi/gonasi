import { lazy, useEffect, useRef } from 'react';
import { Outlet, redirect, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { dataWithError, dataWithSuccess, redirectWithError } from 'remix-toast';

import { fetchNextChapterAndLessonId } from '@gonasi/database/courses';
import {
  createBlockInteraction,
  fetchLessonCompletionStatus,
  fetchUserLessonBlockInteractions,
  fetchValidatedPublishedLessonById,
  resetBlockInteractionsByLesson,
} from '@gonasi/database/lessons';
import type { Interaction } from '@gonasi/schemas/plugins';

import type { Route } from './+types/go-lesson-play';

import { CoursePlayLayout } from '~/components/layouts/course';
import { OutlineButton } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';
import { useStore } from '~/store';

const ViewPluginTypesRenderer = lazy(() => import('~/components/plugins/viewPluginTypesRenderer'));

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

  const [lesson, blockInteractions, nextChapterAndLessonId, lessonCompletionStatus] =
    await Promise.all([
      fetchValidatedPublishedLessonById(supabase, params.lessonId),
      fetchUserLessonBlockInteractions({
        supabase,
        lessonId: params.lessonId,
      }),
      fetchNextChapterAndLessonId(supabase, params.courseId, params.chapterId, params.lessonId),
      fetchLessonCompletionStatus(supabase, params.lessonId),
    ]);

  if (!lesson) {
    return redirectWithError(`/go/courses/${params.courseId}`, 'Lesson not found');
  }

  return { lesson, blockInteractions, nextChapterAndLessonId, lessonCompletionStatus };
}

export default function GoLessonPlay({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const { visibleBlocks, initializePlayFlow, lessonProgress, activeBlock } = useStore();

  const blockRefs = useRef<Record<string, HTMLElement | null>>({});

  const {
    lesson: { blocks },
    blockInteractions,
    nextChapterAndLessonId,
    lessonCompletionStatus,
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
    if (!lessonCompletionStatus?.is_complete && activeBlock) {
      blockRefs.current[activeBlock]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [activeBlock, lessonCompletionStatus?.is_complete]);

  if (!visibleBlocks) return null;

  const handleNavigate = () =>
    navigate(
      `/go/course/${params.courseId}/${nextChapterAndLessonId?.nextChapterId}/${nextChapterAndLessonId?.nextLessonId}/play`,
    );
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
                  className='scroll-mt-18 md:scroll-mt-22'
                >
                  <ViewPluginTypesRenderer block={block} mode='play' />
                </div>
              ))
            : null}
          {lessonCompletionStatus?.is_complete ? (
            <div className='fixed bottom-10'>
              <motion.div initial={nudgeAnimation.initial} animate={nudgeAnimation.animate}>
                <OutlineButton
                  className='bg-card/20 rounded-full'
                  onClick={handleNavigate}
                  rightIcon={<ArrowRight />}
                >
                  {nextChapterAndLessonId?.nextChapterId === params.chapterId
                    ? 'Next lesson'
                    : 'Next chapter'}
                </OutlineButton>
              </motion.div>
            </div>
          ) : null}
        </section>
      </CoursePlayLayout>
      <Outlet />
    </>
  );
}
