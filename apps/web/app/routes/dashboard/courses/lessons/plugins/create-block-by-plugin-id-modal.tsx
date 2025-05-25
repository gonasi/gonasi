import { lazy, Suspense, useMemo } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { parseWithZod } from '@conform-to/zod';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { dataWithError, redirectWithSuccess } from 'remix-toast';

import {
  createMultipleChoiceSingleAnswerBlock,
  createRichTextBlock,
  createTrueOrFalseBlock,
} from '@gonasi/database/lessons';
import {
  getPluginTypeNameById,
  getSchema,
  type PluginGroupId,
  type PluginTypeId,
  type SchemaData,
  schemaMap,
} from '@gonasi/schemas/plugins';

import type { Route } from './+types/create-block-by-plugin-id-modal';
import { createMultipleChoiceMultipleAnswersBlock } from '../../../../../../../../node_modules/@gonasi/database/src/lessons/blocks/multipleChoiceMultipleAnswers/createMultipleChoiceMultipleAnswersBlock';

import { Spinner } from '~/components/loaders';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';

const LazyCreatePluginBlockRenderer = lazy(
  () => import('~/components/plugins/PluginRenderers/CreatePluginBlockRenderer'),
);

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=3600, stale-while-revalidate=3600',
  };
}

// Handles plugin block creation based on the submitted intent
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  // Prevent bots via honeypot check
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const intent = formData.get('intent');

  // Validate intent type and existence in schemaMap
  if (typeof intent !== 'string' || !(intent in schemaMap)) {
    return dataWithError(null, `Unknown intent: ${intent}`);
  }

  const typedIntent = intent as PluginTypeId;
  const schema = getSchema(typedIntent);

  // Validate form data using the appropriate schema
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

    const DEFAULT_WEIGHT = 1;

    switch (typedIntent) {
      case 'rich_text_editor': {
        const value = submission.value as SchemaData<'rich_text_editor'>;
        ({ success, message } = await createRichTextBlock(supabase, {
          content: value,
          lessonId: params.lessonId,
          pluginType: 'rich_text_editor',
          weight: DEFAULT_WEIGHT,
          settings: {
            playbackMode: 'inline',
            weight: DEFAULT_WEIGHT,
          },
        }));
        break;
      }

      case 'true_or_false': {
        const value = submission.value as SchemaData<'true_or_false'>;
        ({ success, message } = await createTrueOrFalseBlock(supabase, {
          content: value,
          lessonId: params.lessonId,
          pluginType: 'true_or_false',
          weight: DEFAULT_WEIGHT,
          settings: {
            playbackMode: 'inline',
            weight: DEFAULT_WEIGHT,
            layoutStyle: 'single',
            randomization: 'none',
          },
        }));
        break;
      }

      case 'multiple_choice_single': {
        const value = submission.value as SchemaData<'multiple_choice_single'>;
        ({ success, message } = await createMultipleChoiceSingleAnswerBlock(supabase, {
          content: value,
          lessonId: params.lessonId,
          pluginType: 'multiple_choice_single',
          weight: DEFAULT_WEIGHT,
          settings: {
            playbackMode: 'inline',
            weight: DEFAULT_WEIGHT,
            layoutStyle: 'single',
            randomization: 'none',
          },
        }));
        break;
      }

      case 'multiple_choice_multiple': {
        const value = submission.value as SchemaData<'multiple_choice_multiple'>;
        ({ success, message } = await createMultipleChoiceMultipleAnswersBlock(supabase, {
          content: value,
          lessonId: params.lessonId,
          pluginType: 'multiple_choice_multiple',
          weight: DEFAULT_WEIGHT + 1,
          settings: {
            playbackMode: 'inline',
            weight: DEFAULT_WEIGHT + 1,
            layoutStyle: 'single',
            randomization: 'none',
          },
        }));
        break;
      }

      default:
        throw new Error(`Unhandled intent: ${typedIntent}`);
    }

    return success ? redirectWithSuccess(redirectUrl, message) : dataWithError(null, message);
  } catch (error) {
    console.error('Error creating block:', error);
    return dataWithError(null, 'Could not create block. Please try again.');
  }
}

export default function CreateBlockByPluginIdModal({ params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}`,
    );
  };

  // Use useMemo to prevent unnecessary recalculations
  const plugin = useMemo(
    () =>
      getPluginTypeNameById(
        params.pluginGroupId as PluginGroupId,
        params.pluginTypeId as PluginTypeId,
      ),
    [params.pluginGroupId, params.pluginTypeId],
  );

  const BackButton = () => (
    <NavLink
      to={`/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}/plugins/${params.pluginGroupId}`}
    >
      {({ isPending }) => (isPending ? <LoaderCircle className='animate-spin' /> : <ArrowLeft />)}
    </NavLink>
  );

  // Determine modal title once
  const modalTitle = plugin || 'Plugin not found';

  return (
    <>
      <Modal open onOpenChange={(open) => !open && handleClose()}>
        <Modal.Content size='md'>
          <Modal.Header leadingIcon={<BackButton />} title={modalTitle} />
          <Modal.Body>
            <Suspense fallback={<Spinner />}>
              {plugin ? (
                <LazyCreatePluginBlockRenderer pluginTypeId={params.pluginTypeId as PluginTypeId} />
              ) : (
                <h1>Plugin not found</h1>
              )}
            </Suspense>
          </Modal.Body>
        </Modal.Content>
      </Modal>
      <Outlet />
    </>
  );
}
