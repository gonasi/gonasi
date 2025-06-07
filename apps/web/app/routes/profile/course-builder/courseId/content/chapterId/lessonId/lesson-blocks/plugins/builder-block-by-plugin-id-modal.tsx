import { lazy, Suspense, useMemo } from 'react';
import { Outlet } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import type z from 'zod';

import { createRichTextBlock } from '@gonasi/database/lessons';
import {
  BuilderSchema,
  getPluginTypeNameById,
  type PluginGroupId,
  type PluginTypeId,
} from '@gonasi/schemas/plugins';

import type { Route } from './+types/builder-block-by-plugin-id-modal';

import { Spinner } from '~/components/loaders';
import { BackArrowNavLink } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';

// Lazy-load plugin block renderer for performance
const LazyCreatePluginBlockRenderer = lazy(
  () => import('~/components/plugins/PluginRenderers/CreatePluginBlockRenderer'),
);

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=3600, stale-while-revalidate=3600',
  };
}

type FormData = z.infer<typeof BuilderSchema>;

// Handles form submission for creating a plugin block
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  // Honeypot anti-bot check
  await checkHoneypot(formData);

  // Validate form data using Zod
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<FormData>(formData, zodResolver(BuilderSchema));

  if (errors) return { errors, defaultValues };

  const basePath = `/${params.username}/course-builder/${params.courseId}/content`;
  const redirectUrl = `${basePath}/${params.chapterId}/${params.lessonId}/lesson-blocks`;

  const { supabase } = createClient(request);

  try {
    let result = { success: false, message: '' };

    switch (data.pluginType) {
      case 'rich_text_editor':
        result = await createRichTextBlock(supabase, { ...data });
        break;

      default:
        throw new Error(`Unhandled plugin type: ${data.pluginType}`);
    }

    return result.success
      ? redirectWithSuccess(redirectUrl, result.message)
      : dataWithError(null, result.message);
  } catch (error) {
    console.error('Error creating block:', error);
    return dataWithError(null, 'Could not create block. Please try again.');
  }
}

// Modal UI to create plugin block
export default function CreateBlockByPluginIdModal({ params }: Route.ComponentProps) {
  const { username, courseId, chapterId, lessonId, pluginGroupId, pluginTypeId } = params;

  const basePath = `/${username}/course-builder/${courseId}/content`;
  const lessonPath = `${basePath}/${chapterId}/${lessonId}/lesson-blocks`;
  const backRoute = `${lessonPath}/plugins/${pluginGroupId}`;

  // Memoize plugin display name resolution
  const plugin = useMemo(
    () => getPluginTypeNameById(pluginGroupId as PluginGroupId, pluginTypeId as PluginTypeId),
    [pluginGroupId, pluginTypeId],
  );

  return (
    <>
      <Modal open>
        <Modal.Content size='md'>
          <Modal.Header
            leadingIcon={<BackArrowNavLink to={backRoute} />}
            title={plugin || 'Plugin not found'}
            closeRoute={lessonPath}
          />
          <Modal.Body>
            <Suspense fallback={<Spinner />}>
              {plugin ? (
                <LazyCreatePluginBlockRenderer pluginTypeId={pluginTypeId as PluginTypeId} />
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
