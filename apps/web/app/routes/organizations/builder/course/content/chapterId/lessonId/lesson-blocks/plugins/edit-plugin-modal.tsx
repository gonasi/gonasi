import { lazy, Suspense } from 'react';
import { Pencil } from 'lucide-react';
import { redirectWithError } from 'remix-toast';

import { fetchSingleBlockByBlockId } from '@gonasi/database/lessons';

import type { Route } from './+types/edit-plugin-modal';

import { Spinner } from '~/components/loaders';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

type Params = Route.LoaderArgs['params'];

// Lazy-load the plugin block renderer to optimize performance
const LazyEditPluginTypesRenderer = lazy(
  () => import('~/components/plugins/PluginRenderers/BuilderPluginBlockRenderer'),
);

// Utility function to construct base URL path for redirects and navigation
const getBasePath = (params: Params) =>
  `/${params.organizationId}/builder/${params.courseId}/content`;

// --- Loader ---
/**
 * Fetches a single lesson block by blockId.
 * Redirects with an error message if the block is not found.
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [lessonBlock, canEdit] = await Promise.all([
    fetchSingleBlockByBlockId(supabase, params.blockId),
    supabase.rpc('can_user_edit_course', {
      arg_course_id: params.courseId,
    }),
  ]);

  if (!canEdit.data) {
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/content/${params.chapterId}/${params.lessonId}/lesson-blocks`,
      'You don’t have permission to edit blocks.',
    );
  }

  if (!lessonBlock.data) {
    const redirectUrl = `${getBasePath(params)}/${params.chapterId}/${params.lessonId}/lesson-blocks`;
    return redirectWithError(redirectUrl, 'Lesson block not found');
  }

  return lessonBlock;
}

export type LessonBlockLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data'];

// --- Component ---
/**
 * Modal for editing a plugin block in a course builder.
 * Renders a suspense-wrapped plugin renderer based on plugin_type.
 */
export default function EditPluginsModal({ loaderData, params }: Route.ComponentProps) {
  const block = loaderData.data;
  const closeUrl = `${getBasePath(params)}/${params.chapterId}/${params.lessonId}/lesson-blocks`;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header leadingIcon={<Pencil size={14} />} title='Edit' closeRoute={closeUrl} />
        <Modal.Body>
          <Suspense fallback={<Spinner />}>
            <LazyEditPluginTypesRenderer pluginTypeId={block.plugin_type} block={block} />
          </Suspense>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
