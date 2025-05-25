import { lazy, Suspense, useEffect, useState } from 'react';
import { data, Outlet, useFetcher, useNavigate } from 'react-router';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { NotebookPen } from 'lucide-react';
import { dataWithError, redirectWithError } from 'remix-toast';
import { ClientOnly } from 'remix-utils/client-only';

import {
  fetchLessonBlocksByLessonId,
  fetchUserLessonById,
  updateBlockPositions,
} from '@gonasi/database/lessons';
import { BlocksPositionUpdateArraySchema } from '@gonasi/schemas/plugins';

import type { Route } from './+types/edit-lesson-content';

import { Spinner } from '~/components/loaders';
import LessonBlockWrapper from '~/components/plugins/LessonBlockWrapper';
import { PluginButton } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

const ViewPluginTypesRenderer = lazy(
  () => import('~/components/plugins/PluginRenderers/ViewPluginTypesRenderer'),
);

function toTitleCaseFromUnderscore(input: string): string {
  return input
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Loader
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // fetch a lesson and blocks associated with the lesson
  const [lesson, lessonBlocks] = await Promise.all([
    fetchUserLessonById(supabase, params.lessonId),
    fetchLessonBlocksByLessonId(supabase, params.lessonId),
  ]);

  if (!lesson || !lessonBlocks.data) {
    return redirectWithError(getBasePath(params), 'Lesson not found');
  }

  return { lesson, lessonBlocks: lessonBlocks.data };
}

// Action
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const { supabase } = createClient(request);

  const intent = formData.get('intent');

  if (intent === 'reorder-blocks') {
    const blocksRaw = formData.get('blocks');

    if (typeof blocksRaw !== 'string') {
      throw new Response('Invalid data', { status: 400 });
    }

    const parsed = BlocksPositionUpdateArraySchema.safeParse(JSON.parse(blocksRaw));

    if (!parsed.success) {
      console.error(parsed.error);
      throw new Response('Validation failed', { status: 400 });
    }

    const { success, message } = await updateBlockPositions(supabase, parsed.data);

    if (!success) {
      return dataWithError(null, message ?? 'Could not re-order blocks');
    }

    // Return proper response object instead of true
    return data({ success: true });
  }

  return true;
}

// Helper to build base path
function getBasePath(params: { companyId: string; courseId: string }) {
  return `/dashboard/${params.companyId}/courses/${params.courseId}/course-content`;
}

function getLessonPath(params: {
  companyId: string;
  courseId: string;
  chapterId: string;
  lessonId: string;
}) {
  return `${getBasePath(params)}/${params.chapterId}/${params.lessonId}`;
}

// Component
export default function EditLessonContent({ loaderData, params }: Route.ComponentProps) {
  const { lesson, lessonBlocks } = loaderData;
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const navigateTo = (path: string) => () => navigate(path);

  const [myLessonBlocks, setMyLessonBlocks] = useState(lessonBlocks ?? []);
  const [lessonLoading, setLessonsLoading] = useState(false);

  useEffect(() => {
    // Update lessons if prop changes
    setMyLessonBlocks(lessonBlocks ?? []);
  }, [lessonBlocks]);

  // Set up an effect to monitor fetcher state
  useEffect(() => {
    if (fetcher.state === 'submitting') {
      setLessonsLoading(true);
    } else if (fetcher.state === 'idle' && fetcher.data) {
      setLessonsLoading(false);
    }
  }, [fetcher.state, fetcher.data]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      let newLessons: typeof lessonBlocks = [];

      setMyLessonBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        newLessons = arrayMove(items, oldIndex, newIndex);
        return newLessons;
      });

      if (newLessons.length) {
        const simplifiedLessonBlocks = newLessons.map((newLesson, index) => ({
          ...newLesson,
          position: index,
        }));

        const formData = new FormData();

        formData.append('intent', 'reorder-blocks');
        formData.append('blocks', JSON.stringify(simplifiedLessonBlocks));

        fetcher.submit(formData, {
          method: 'post',
        });
      }
    }
  }

  return (
    <>
      <Modal open onOpenChange={(open) => open || navigateTo(getBasePath(params))()}>
        <Modal.Content size='full'>
          <Modal.Header
            leadingIcon={<NotebookPen />}
            title={lesson.name}
            subTitle={lesson.lesson_types?.name}
          />
          <div className='mx-auto flex max-w-xl flex-col space-y-8 px-4 py-10 md:px-0'>
            <DndContext
              modifiers={[restrictToVerticalAxis]}
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={myLessonBlocks} strategy={verticalListSortingStrategy}>
                {myLessonBlocks.length > 0 ? (
                  myLessonBlocks.map((block) => (
                    <LessonBlockWrapper
                      key={block.id}
                      id={block.id}
                      loading={lessonLoading}
                      title={toTitleCaseFromUnderscore(block.plugin_type)}
                      onEdit={navigateTo(`${getLessonPath(params)}/${block.id}/edit`)}
                      onEditSettings={navigateTo(`${getLessonPath(params)}/${block.id}/settings`)}
                      onDelete={navigateTo(`${getLessonPath(params)}/${block.id}/delete`)}
                    >
                      <ClientOnly fallback={<Spinner />}>
                        {() => (
                          <Suspense fallback={<Spinner />}>
                            <ViewPluginTypesRenderer block={block} mode='preview' />
                          </Suspense>
                        )}
                      </ClientOnly>
                    </LessonBlockWrapper>
                  ))
                ) : (
                  <p>No blocks found</p>
                )}
              </SortableContext>
            </DndContext>
          </div>
          <PluginButton onClick={navigateTo(`${getLessonPath(params)}/plugins`)} />
        </Modal.Content>
      </Modal>
      <Outlet />
    </>
  );
}
