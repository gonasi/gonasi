import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import type z from 'zod';

import { upsertLiveSessionBlock } from '@gonasi/database/liveSessions';
import { LiveSessionBuilderSchema } from '@gonasi/schemas/liveSessions';

import type { Route } from './+types/upsert-block-api';

import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';

type FormData = z.infer<typeof LiveSessionBuilderSchema>;

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<FormData>(formData, zodResolver(LiveSessionBuilderSchema));

  if (errors) {
    console.error('[UpsertLiveBlock] Validation errors:', JSON.stringify(errors, null, 2));
    console.error('[UpsertLiveBlock] Received values:', JSON.stringify(defaultValues, null, 2));
    return { errors, defaultValues };
  }

  const isCreate = !params.blockId || params.blockId === 'create-new';
  const blocksPath = `/${params.organizationId}/live-sessions/${params.sessionId}/blocks`;

  const result = await upsertLiveSessionBlock({
    supabase,
    payload: {
      id: isCreate ? undefined : params.blockId,
      live_session_id: data.live_session_id,
      organization_id: data.organization_id,
      plugin_type: data.plugin_type,
      content: data.content,
      settings: data.settings,
      difficulty: data.difficulty,
      time_limit: data.time_limit,
    },
  });

  return result.success
    ? redirectWithSuccess(blocksPath, result.message)
    : dataWithError(null, result.message);
}
