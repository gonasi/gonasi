import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { parseWithZod } from '@conform-to/zod';
import { Settings as LucideSettings } from 'lucide-react';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';

import {
  editMultipleChoiceSingleAnswerSettings,
  editRichTextBlockSettings,
  editTrueOrFalseBlockSettings,
  fetchBlockSettingsByBlockId,
} from '@gonasi/database/lessons';
import {
  type PluginTypeId,
  schemaMap,
  type SettingsData,
  settingsSchemaMap,
} from '@gonasi/schemas/plugins';
import { formatLabel } from '@gonasi/utils/formatLabel';

import type { Route } from './+types/edit-plugin-settings-modal';

import { Spinner } from '~/components/loaders';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';

const LazyEditPluginSettingsTypeRenderer = lazy(
  () => import('~/components/plugins/PluginRenderers/EditPluginSettingsTypeRenderer'),
);

// --- Action Handler ---
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
  const schema = settingsSchemaMap[typedIntent];

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
        const value = submission.value as SettingsData<'rich_text_editor'>;
        ({ success, message } = await editRichTextBlockSettings({
          supabase,
          data: {
            ...value,
            blockId: params.blockId,
          },
        }));
        break;
      }

      case 'true_or_false': {
        const value = submission.value as SettingsData<'true_or_false'>;
        ({ success, message } = await editTrueOrFalseBlockSettings({
          supabase,
          data: {
            ...value,
            blockId: params.blockId,
          },
        }));
        break;
      }

      case 'multiple_choice_single': {
        const value = submission.value as SettingsData<'multiple_choice_single'>;
        ({ success, message } = await editMultipleChoiceSingleAnswerSettings({
          supabase,
          data: {
            ...value,
            blockId: params.blockId,
          },
        }));
        break;
      }

      default:
        throw new Error(`Unhandled intent: ${typedIntent}`);
    }
    return success ? redirectWithSuccess(redirectUrl, message) : dataWithError(null, message);
  } catch (error) {
    console.error('Error creating block: ', error);
    return dataWithError(null, 'Could not create block. Please try again');
  }
}

// --- Loader ---
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { data } = await fetchBlockSettingsByBlockId(supabase, params.blockId);

  if (!data) {
    const path = `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}`;
    return redirectWithError(path, 'Lesson block not found');
  }

  return { data };
}

export type SettingsLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data'];

// --- Component ---
export default function EditPluginSettingsModal({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { data } = loaderData;

  const handleClose = () => {
    navigate(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}`,
    );
  };

  return (
    <Modal open onOpenChange={(open) => !open && handleClose()}>
      <Modal.Content size='md'>
        <Modal.Header
          leadingIcon={<LucideSettings size={14} />}
          title={`Edit ${formatLabel(data.plugin_type)} Settings`}
        />
        <Modal.Body>
          <Suspense fallback={<Spinner />}>
            <LazyEditPluginSettingsTypeRenderer block={data} />
          </Suspense>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
