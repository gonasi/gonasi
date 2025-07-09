import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';

import { deleteBlockById } from '@gonasi/database/lessons/blocks';

import type { Route } from './+types/delete-plugin-modal';

import { createClient } from '~/lib/supabase/supabase.server';

type Params = Route.LoaderArgs['params'];

const getBasePath = (params: Params) =>
  `/${params.organizationId}/builder/${params.courseId}/content`;

// Use loader instead of action for automatic invocation on route visit
export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const canDelete = await supabase.rpc('can_user_edit_course', {
    arg_course_id: params.courseId,
  });

  if (!canDelete.data) {
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/content/${params.chapterId}/${params.lessonId}/lesson-blocks`,
      'You don’t have permission to delete blocks.',
    );
  }

  const { success, message } = await deleteBlockById(supabase, params.blockId);

  if (!success) {
    return dataWithError(null, message);
  }

  const redirectUrl = `${getBasePath(params)}/${params.chapterId}/${params.lessonId}/lesson-blocks`;

  return redirectWithSuccess(redirectUrl, message);
}
