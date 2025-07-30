import { redirectWithError } from 'remix-toast';

import { fetchSingleBlockByBlockId } from '@gonasi/database/lessons';

import type { Route } from './+types/edit-plugin-modal';

import BuilderPluginBlockRenderer from '~/components/plugins/PluginRenderers/BuilderPluginBlockRenderer';
import { createClient } from '~/lib/supabase/supabase.server';

type Params = Route.LoaderArgs['params'];

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

export default function EditPluginsModal({ loaderData }: Route.ComponentProps) {
  const block = loaderData.data;

  return <BuilderPluginBlockRenderer pluginTypeId={block.plugin_type} block={block} />;
}
