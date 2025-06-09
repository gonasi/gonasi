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

import type { Route } from './+types/lesson-blocks-index';

import { Spinner } from '~/components/loaders';
import LessonBlockWrapper from '~/components/plugins/LessonBlockWrapper';
import { PluginButton } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

// Lazy load plugin renderer for better performance
const ViewPluginTypesRenderer = lazy(
  () => import('~/components/plugins/PluginRenderers/ViewPluginTypesRenderer'),
);

/**
 * Utility: Converts strings like "plugin_type_example" to "Plugin Type Example"
 */
function toTitleCaseFromUnderscore(input: string): string {
  return input
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// --- Loader ---
// Fetch lesson details and associated blocks using Supabase client
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [lesson, lessonBlocks] = await Promise.all([
    fetchUserLessonById(supabase, params.lessonId),
    fetchLessonBlocksByLessonId(supabase, params.lessonId),
  ]);

  if (!lesson || !lessonBlocks.data) {
    // Redirect with error if data is missing
    return redirectWithError(
      `/${params.username}/course-builder/${params.courseId}/content`,
      'Lesson not found',
    );
  }

  return { lesson, lessonBlocks: lessonBlocks.data };
}

// --- Action ---
// Handle form submission for reordering lesson blocks
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const { supabase } = createClient(request);

  if (formData.get('intent') === 'reorder-blocks') {
    const blocksRaw = formData.get('blocks');

    if (typeof blocksRaw !== 'string') {
      throw new Response('Invalid data', { status: 400 });
    }

    // Validate the blocks position data using Zod schema
    const parsed = BlocksPositionUpdateArraySchema.safeParse(JSON.parse(blocksRaw));

    if (!parsed.success) {
      console.error(parsed.error);
      throw new Response('Validation failed', { status: 400 });
    }

    // Update positions in DB
    const { success, message } = await updateBlockPositions(supabase, parsed.data);

    if (!success) {
      return dataWithError(null, message ?? 'Could not re-order blocks');
    }

    return data({ success: true });
  }

  return true;
}

export default function EditLessonContent({ loaderData, params }: Route.ComponentProps) {
  const { lesson, lessonBlocks } = loaderData;
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const basePath = `/${params.username}/course-builder/${params.courseId}/content`;
  const lessonBasePath = `${basePath}/${params.chapterId}/${params.lessonId}/lesson-blocks`;

  const navigateTo = (path: string) => () => navigate(path);

  const [myLessonBlocks, setMyLessonBlocks] = useState(lessonBlocks ?? []);
  const [lessonLoading, setLessonsLoading] = useState(false);

  useEffect(() => {
    setMyLessonBlocks(lessonBlocks ?? []);
  }, [lessonBlocks]);

  useEffect(() => {
    if (fetcher.state === 'submitting') {
      setLessonsLoading(true);
    } else if (fetcher.state === 'idle' && fetcher.data) {
      setLessonsLoading(false);
    }
  }, [fetcher.state, fetcher.data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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
        const simplifiedLessonBlocks = newLessons.map((block, index) => ({
          ...block,
          position: index,
        }));

        const formData = new FormData();
        formData.append('intent', 'reorder-blocks');
        formData.append('blocks', JSON.stringify(simplifiedLessonBlocks));

        fetcher.submit(formData, { method: 'post' });
      }
    }
  }

  return (
    <>
      <Modal open>
        <Modal.Content size='full'>
          <Modal.Header
            leadingIcon={<NotebookPen />}
            title={lesson.name}
            subTitle={lesson.lesson_types?.name}
            closeRoute={basePath}
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
                  myLessonBlocks.map((block) => {
                    const blockIdPath = `${lessonBasePath}/${block.id}`;
                    return (
                      <LessonBlockWrapper
                        key={block.id}
                        id={block.id}
                        loading={lessonLoading}
                        title={toTitleCaseFromUnderscore(block.plugin_type)}
                        onEdit={navigateTo(`${blockIdPath}/edit`)}
                        onEditSettings={navigateTo(`${blockIdPath}/settings`)}
                        onDelete={navigateTo(`${blockIdPath}/delete`)}
                      >
                        <ClientOnly fallback={<Spinner />}>
                          {() => (
                            <Suspense fallback={<Spinner />}>
                              <ViewPluginTypesRenderer block={block} mode='preview' />
                            </Suspense>
                          )}
                        </ClientOnly>
                      </LessonBlockWrapper>
                    );
                  })
                ) : (
                  <p>No blocks found</p>
                )}
              </SortableContext>
            </DndContext>
          </div>

          <PluginButton onClick={navigateTo(`${lessonBasePath}/plugins`)} />
        </Modal.Content>
      </Modal>
      <Outlet />
    </>
  );
}
