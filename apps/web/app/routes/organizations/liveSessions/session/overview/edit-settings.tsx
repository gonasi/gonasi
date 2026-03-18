import { Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Globe, Lock, MailPlus } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { editLiveSessionSettings, fetchLiveSessionById } from '@gonasi/database/liveSessions';
import {
  EditLiveSessionSettingsSchema,
  type EditLiveSessionSettingsSchemaTypes,
} from '@gonasi/schemas/liveSessions';

import type { Route } from './+types/edit-settings';

import { Button } from '~/components/ui/button';
import {
  GoCheckBoxField,
  GoInputField,
  GoRadioGroupField,
} from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Edit Session Settings • Gonasi' },
    {
      name: 'description',
      content: 'Update your live session visibility, participant settings, and features.',
    },
  ];
}

const resolver = zodResolver(EditLiveSessionSettingsSchema);

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditLiveSessionSettingsSchemaTypes>(formData, resolver);

  if (errors) {
    return { errors, defaultValues };
  }

  const { success, message } = await editLiveSessionSettings({ supabase, data });

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

export default function EditLiveSessionSettings({ params, loaderData }: Route.ComponentProps) {
  const { session } = loaderData;

  const form = useRemixForm<EditLiveSessionSettingsSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      organizationId: params.organizationId,
      sessionId: params.sessionId,
      visibility: session.visibility,
      sessionKey: session.session_key ?? '',
      maxParticipants: session.max_participants ?? undefined,
      allowLateJoin: session.allow_late_join,
      showLeaderboard: session.show_leaderboard,
      enableChat: session.enable_chat,
      enableReactions: session.enable_reactions,
      timeLimitPerQuestion: undefined,
    },
  });

  const isPending = useIsPending();
  const isDisabled = isPending || form.formState.isSubmitting;

  const watchVisibility = form.watch('visibility');
  const closeRoute = `/${params.organizationId}/live-sessions/${params.sessionId}/overview`;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title='Edit Session Settings' closeRoute={closeRoute} />
        <Modal.Body>
          <RemixFormProvider {...form}>
            <Form method='POST' onSubmit={form.handleSubmit}>
              <HoneypotInputs />

              <GoRadioGroupField
                labelProps={{
                  children: 'Visibility',
                  endAdornment:
                    watchVisibility === 'public' ? (
                      <Globe size={14} />
                    ) : watchVisibility === 'private' ? (
                      <Lock size={14} />
                    ) : (
                      <MailPlus size={14} />
                    ),
                  endAdornmentKey: watchVisibility,
                }}
                name='visibility'
                description='Who can discover and join this session.'
                options={[
                  {
                    value: 'public',
                    label: 'Public – anyone can join with the session code 🌍',
                  },
                  {
                    value: 'unlisted',
                    label: 'Unlisted – only those with the link can join 🔗',
                  },
                  {
                    value: 'private',
                    label: 'Private – requires a session key to join 🔒',
                  },
                ]}
              />

              {watchVisibility === 'private' && (
                <GoInputField
                  labelProps={{ children: 'Session key', required: true }}
                  name='sessionKey'
                  inputProps={{
                    disabled: isDisabled,
                    placeholder: 'Enter a password for this session',
                  }}
                  description='Required for private sessions (4-50 characters).'
                />
              )}

              <GoInputField
                labelProps={{ children: 'Max participants' }}
                name='maxParticipants'
                inputProps={{
                  type: 'number',
                  disabled: isDisabled,
                  placeholder: 'Unlimited',
                  min: 1,
                  max: 1000,
                }}
                description='Maximum number of participants (leave empty for unlimited).'
              />

              <div className='space-y-3'>
                <p className='text-sm font-medium'>Session features</p>
                <GoCheckBoxField
                  labelProps={{ children: 'Allow late join' }}
                  name='allowLateJoin'
                  checkboxProps={{ disabled: isDisabled }}
                  description='Allow participants to join after the session has started.'
                />
                <GoCheckBoxField
                  labelProps={{ children: 'Show leaderboard' }}
                  name='showLeaderboard'
                  checkboxProps={{ disabled: isDisabled }}
                  description='Display a live leaderboard during the session.'
                />
                <GoCheckBoxField
                  labelProps={{ children: 'Enable chat' }}
                  name='enableChat'
                  checkboxProps={{ disabled: isDisabled }}
                  description='Allow participants to send messages during the session.'
                />
                <GoCheckBoxField
                  labelProps={{ children: 'Enable reactions' }}
                  name='enableReactions'
                  checkboxProps={{ disabled: isDisabled }}
                  description='Allow participants to react with emoji during the session.'
                />
              </div>

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
