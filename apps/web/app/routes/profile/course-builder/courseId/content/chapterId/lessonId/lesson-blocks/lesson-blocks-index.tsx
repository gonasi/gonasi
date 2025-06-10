import { lazy, Suspense, useEffect, useState } from 'react';
import { data, Outlet, useFetcher, useNavigate } from 'react-router';
import { Reorder } from 'framer-motion';
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

export type Block = NonNullable<BlockType>[number];

export type BlockType = Exclude<Awaited<ReturnType<typeof loader>>, Response>['lessonBlocks'];

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
export async function action({ request, params }: Route.ActionArgs) {
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
    const result = await updateBlockPositions({
      supabase,
      lessonId: params.lessonId,
      blockPositions: parsed.data,
    });

    return result.success
      ? data({ success: true })
      : dataWithError(null, result.message ?? 'Could not re-order blocks');
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

  const [reorderedBlocks, setReorderedBlocks] = useState<Block[]>(lessonBlocks ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setReorderedBlocks(lessonBlocks ?? []);
  }, [lessonBlocks]);

  useEffect(() => {
    if (fetcher.state === 'submitting') {
      setIsSubmitting(true);
    }
  }, [fetcher.state]);

  function handleReorder(updated: Block[]) {
    setReorderedBlocks(updated);

    const orderedData = updated.map((chapter, index) => ({
      id: chapter.id,
      position: index + 1,
    }));

    const formData = new FormData();
    formData.append('intent', 'reorder-blocks');
    formData.append('blocks', JSON.stringify(orderedData));

    fetcher.submit(formData, { method: 'post' });
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
          <div className='mx-auto flex max-w-xl pr-4 pl-8 md:px-0'>
            {reorderedBlocks.length > 0 ? (
              <Reorder.Group
                axis='y'
                values={reorderedBlocks}
                onReorder={handleReorder}
                className='flex w-full flex-col space-y-8 py-10'
              >
                {reorderedBlocks.map((block) => {
                  const blockIdPath = `${lessonBasePath}/${block.id}`;
                  return (
                    <LessonBlockWrapper
                      key={block.id}
                      block={block}
                      loading={isSubmitting}
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
                })}
              </Reorder.Group>
            ) : (
              <p>No blocks found</p>
            )}
          </div>

          <PluginButton onClick={navigateTo(`${lessonBasePath}/plugins`)} />
        </Modal.Content>
      </Modal>
      <Outlet />
    </>
  );
}
