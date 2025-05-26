import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { parseWithZod } from '@conform-to/zod';
import { Pencil } from 'lucide-react';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';

import {
  fetchSingleBlockByBlockId,
  updateMultipleChoiceMultipleAnswers,
  updateMultipleChoiceSingleAnswer,
  updateRichTextBlock,
  updateTapToReveal,
  updateTrueOrFalseBlock,
} from '@gonasi/database/lessons';
import { getSchema, type PluginTypeId, type SchemaData, schemaMap } from '@gonasi/schemas/plugins';

import type { Route } from './+types/edit-plugin-modal';

import { Spinner } from '~/components/loaders';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';

const LazyEditPluginTypesRenderer = lazy(
  () => import('~/components/plugins/PluginRenderers/EditPluginTypesRenderer'),
);

// --- Action Handler ---
// TODO: DRY
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  // Basic bot protection
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const intent = formData.get('intent');

  // Validate intent
  if (typeof intent !== 'string' || !(intent in schemaMap)) {
    return dataWithError(null, `Unknown intent: ${intent}`);
  }

  const typedIntent = intent as PluginTypeId;
  const schema = getSchema(typedIntent);

  // Validate form data against schema
  const submission = parseWithZod(formData, { schema });

  if (submission.status !== 'success') {
    return {
      result: submission.reply(),
      status: submission.status === 'error' ? 400 : 200,
    };
  }

  const redirectUrl = `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}`;

  try {
    let success = false;
    let message = '';

    switch (typedIntent) {
      case 'rich_text_editor': {
        const value = submission.value as SchemaData<'rich_text_editor'>;
        ({ success, message } = await updateRichTextBlock({
          supabase,
          blockId: params.blockId,
          content: value,
        }));
        break;
      }

      case 'true_or_false': {
        const value = submission.value as SchemaData<'true_or_false'>;
        ({ success, message } = await updateTrueOrFalseBlock({
          supabase,
          blockId: params.blockId,
          content: value,
        }));
        break;
      }

      case 'multiple_choice_single': {
        const value = submission.value as SchemaData<'multiple_choice_single'>;
        ({ success, message } = await updateMultipleChoiceSingleAnswer({
          supabase,
          blockId: params.blockId,
          content: value,
        }));
        break;
      }

      case 'multiple_choice_multiple': {
        const value = submission.value as SchemaData<'multiple_choice_multiple'>;
        ({ success, message } = await updateMultipleChoiceMultipleAnswers({
          supabase,
          blockId: params.blockId,
          content: value,
        }));
        break;
      }

      case 'tap_to_reveal': {
        const value = submission.value as SchemaData<'tap_to_reveal'>;
        ({ success, message } = await updateTapToReveal({
          supabase,
          blockId: params.blockId,
          content: value,
        }));
        break;
      }

      default:
        throw new Error(`Unhandled intent: ${typedIntent}`);
    }

    return success ? redirectWithSuccess(redirectUrl, message) : dataWithError(null, message);
  } catch (error) {
    console.error('Error creating block: ', error);
    return dataWithError(null, 'Could not edit block. Please try again');
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
