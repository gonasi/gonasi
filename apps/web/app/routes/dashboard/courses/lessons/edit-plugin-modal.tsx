import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { parseWithZod } from '@conform-to/zod';
import { Pencil } from 'lucide-react';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';

import { fetchSingleBlockByBlockId, updateLessonBlock } from '@gonasi/database/lessons';
import { getContentSchemaByType, type PluginTypeId } from '@gonasi/schemas/plugins';

import type { Route } from './+types/edit-plugin-modal';

import { Spinner } from '~/components/loaders';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';

const LazyEditPluginTypesRenderer = lazy(
  () => import('~/components/plugins/editPluginTypesRenderer'),
);

// --- Action Handler ---
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const pluginType = formData.get('intent') as PluginTypeId;
  const PluginTypeSchema = getContentSchemaByType(pluginType);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: PluginTypeSchema });

  if (submission.status !== 'success') {
    return {
      result: submission.reply(),
      status: submission.status === 'error' ? 400 : 200,
    };
  }

  const { success, message } = await updateLessonBlock(supabase, params.blockId, {
    content: submission.value,
  });

  const redirectPath = `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}/edit-content`;

  return success ? redirectWithSuccess(redirectPath, message) : dataWithError(null, message);
}

// --- Loader ---
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const lessonBlock = await fetchSingleBlockByBlockId(supabase, params.blockId);

  if (!lessonBlock.data) {
    const redirectPath = `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}/edit-content`;
    return redirectWithError(redirectPath, 'Lesson block not found');
  }

  return lessonBlock;
}

export type LessonBlockLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data'];

// --- Component ---
export default function EditPluginsModal({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const block = loaderData.data;

  const handleClose = () => {
    navigate(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}/edit-content`,
    );
  };

  return (
    <Modal open onOpenChange={(open) => !open && handleClose()}>
      <Modal.Content size='md'>
        <Modal.Header leadingIcon={<Pencil size={14} />} title='Edit' />
        <Modal.Body>
          <Suspense fallback={<Spinner />}>
            <LazyEditPluginTypesRenderer block={block} />
          </Suspense>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
