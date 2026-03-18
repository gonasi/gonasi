import { Form, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { deleteLiveSession, fetchLiveSessionById } from '@gonasi/database/liveSessions';
import { DeleteLiveSessionSchema, type DeleteLiveSessionSchemaTypes } from '@gonasi/schemas/liveSessions';

import type { Route } from './+types/delete-session';

import { DeleteConfirmationLayout } from '~/components/layouts/modals';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(DeleteLiveSessionSchema);

export function meta() {
  return [
    { title: 'Delete Session • Gonasi' },
    {
      name: 'description',
      content: 'Permanently delete this live session and all associated data.',
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);
  const sessionId = params.sessionId ?? '';

  const session = await fetchLiveSessionById({ supabase, sessionId });

  if (!session) {
    return redirectWithError(
      `/${params.organizationId}/live-sessions`,
      'Session not found.',
      { headers },
    );
  }

  return { session: { id: session.id, name: session.name } };
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase, headers } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<DeleteLiveSessionSchemaTypes>(formData, resolver);

  if (errors) return { errors, defaultValues };

  const result = await deleteLiveSession({
    supabase,
    sessionId: data.sessionId,
    organizationId: data.organizationId,
  });

  const redirectTo = `/${params.organizationId}/live-sessions`;

  return result.success
    ? redirectWithSuccess(redirectTo, result.message, { headers })
    : dataWithError(null, result.message, { headers });
}

export default function DeleteSession({ loaderData, params }: Route.ComponentProps) {
  const { session } = loaderData;
  const navigate = useNavigate();
  const isPending = useIsPending();

  const closeRoute = `/${params.organizationId}/live-sessions/${params.sessionId}/overview`;

  const methods = useRemixForm<DeleteLiveSessionSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      sessionId: session.id,
      organizationId: params.organizationId,
    },
  });

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header title='Delete Session' closeRoute={closeRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <DeleteConfirmationLayout
                titlePrefix='Are you sure you want to delete the session:'
                title={session.name}
                isLoading={isPending}
                handleClose={() => navigate(closeRoute)}
              />
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
