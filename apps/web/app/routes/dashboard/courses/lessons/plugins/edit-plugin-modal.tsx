import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { parseWithZod } from '@conform-to/zod';
import { Pencil } from 'lucide-react';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';

import { fetchSingleBlockByBlockId, updateRichTextBlock } from '@gonasi/database/lessons';
import { type PluginTypeId, schemaMap } from '@gonasi/schemas/plugins';

import type { Route } from './+types/edit-plugin-modal';

import { Spinner } from '~/components/loaders';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';

const LazyEditPluginTypesRenderer = lazy(() => import('~/components/plugins/EditPluginRenderer'));

// --- Action Handler ---
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const intent = formData.get('intent');

  if (typeof intent !== 'string' || !(intent in schemaMap)) {
    return dataWithError(null, `Unknown intent: ${intent}`);
  }

  const typedIntent = intent as PluginTypeId;
  const schema = schemaMap[typedIntent];

  const submission = parseWithZod(formData, { schema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { supabase } = createClient(request);

  try {
    switch (typedIntent) {
      case 'rich_text_editor': {
        const { success, message } = await updateRichTextBlock({
          supabase,
          blockId: params.blockId,
          blockData: {
            ...submission.value,
          },
        });

        return success
          ? redirectWithSuccess(
              `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}`,
              message,
            )
          : dataWithError(null, message);
      }
      default:
        throw new Error(`Unhandled intent: ${typedIntent}`);
    }
  } catch (error) {
    console.error('Error creating block: ', error);
    return dataWithError(null, 'Could not create block. Please try again');
  }
}

// --- Loader ---
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const lessonBlock = await fetchSingleBlockByBlockId(supabase, params.blockId);

  if (!lessonBlock.data) {
    const redirectPath = `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}`;
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
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}`,
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
