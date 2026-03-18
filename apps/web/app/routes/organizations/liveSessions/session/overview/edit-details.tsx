import { Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { editLiveSessionDetails, fetchLiveSessionById } from '@gonasi/database/liveSessions';
import {
  EditLiveSessionDetailsSchema,
  type EditLiveSessionDetailsSchemaTypes,
} from '@gonasi/schemas/liveSessions';

import type { Route } from './+types/edit-details';

import { Button } from '~/components/ui/button';
import { GoInputField, GoTextAreaField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Edit Session Details • Gonasi' },
    {
      name: 'description',
      content: 'Update your live session title, description, and scheduled start time.',
    },
  ];
}

const resolver = zodResolver(EditLiveSessionDetailsSchema);

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditLiveSessionDetailsSchemaTypes>(formData, resolver);

  if (errors) {
    return { errors, defaultValues };
  }

  const { success, message } = await editLiveSessionDetails({ supabase, data });

  const redirectTo = `/${params.organizationId}/live-sessions/${params.sessionId}/overview`;

  return success ? redirectWithSuccess(redirectTo, message) : dataWithError(null, message);
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const sessionId = params.sessionId ?? '';
  const orgId = params.organizationId;

  const [session, canEditRes] = await Promise.all([
    fetchLiveSessionById({ supabase, sessionId }),
    supabase.rpc('can_user_edit_live_session', { arg_session_id: sessionId }),
  ]);

  if (!session || !canEditRes.data) {
    throw redirectWithError(
      `/${orgId}/live-sessions/${sessionId}/overview`,
      'Session not found or no permissions',
    );
  }

  return {
    session,
  };
}

export default function EditLiveSessionDetails({ params, loaderData }: Route.ComponentProps) {
  const { session } = loaderData;

  const form = useRemixForm<EditLiveSessionDetailsSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      organizationId: params.organizationId,
      sessionId: params.sessionId,
      name: session.name,
      description: session.description ?? '',
      scheduledStartTime: session.scheduled_start_time ?? undefined,
    },
  });

  const isPending = useIsPending();
  const isDisabled = isPending || form.formState.isSubmitting;

  const closeRoute = `/${params.organizationId}/live-sessions/${params.sessionId}/overview`;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title='Edit Session Details' closeRoute={closeRoute} />
        <Modal.Body>
          <RemixFormProvider {...form}>
            <Form method='POST' onSubmit={form.handleSubmit}>
              <HoneypotInputs />

              <GoInputField
                labelProps={{ children: 'Session name', required: true }}
                name='name'
                inputProps={{
                  autoFocus: true,
                  disabled: isDisabled,
                }}
                description='Enter the session name.'
              />
              <GoTextAreaField
                labelProps={{ children: 'Session description' }}
                name='description'
                textareaProps={{
                  disabled: isDisabled,
                  placeholder: 'Optional description for your session',
                }}
                description='Provide a brief session description.'
              />
              <GoInputField
                labelProps={{ children: 'Scheduled start time' }}
                name='scheduledStartTime'
                inputProps={{
                  type: 'datetime-local',
                  disabled: isDisabled,
                }}
                description='Set when the session should start (cannot be in the past).'
              />
              <Button
                type='submit'
                disabled={isDisabled || !form.formState.isDirty}
                isLoading={isDisabled}
              >
                Save
              </Button>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
