import { Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { createLiveSession } from '@gonasi/database/liveSessions';
import { fetchOrgTierLimits } from '@gonasi/database/organizations';
import { NewLiveSessionSchema, type NewLiveSessionSchemaTypes } from '@gonasi/schemas/liveSessions';

import type { Route } from './+types/new-session';

import { BannerCard } from '~/components/cards';
import { Button } from '~/components/ui/button';
import { GoInputField, GoSelectInputField, GoTextAreaField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

// SEO metadata
export function meta() {
  return [
    { title: 'Create Live Session • Gonasi' },
    {
      name: 'description',
      content: 'Create a new live interactive session on Gonasi.',
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const tierLimits = await fetchOrgTierLimits({ supabase, organizationId: params.organizationId });
  return { tierLimits };
}

// Zod resolver for validation
const resolver = zodResolver(NewLiveSessionSchema);

// Server-side form submission handler
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  // Bot protection
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  // Validate form data
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<NewLiveSessionSchemaTypes>(formData, resolver);

  if (errors) {
    return { errors, defaultValues };
  }

  // Create live session in DB
  const result = await createLiveSession({ supabase, data });

  if (!result.success || !result.data) {
    console.log('Error creating live session:', result.message);
    return dataWithError(null, result.message);
  }

  return redirectWithSuccess(
    `/${params.organizationId}/live-sessions/${result.data.id}/overview`,
    `${result.message} Session code: ${result.data.sessionCode}`,
  );
}

// Component: New Live Session Modal
export default function NewSession({ params, loaderData }: Route.ComponentProps) {
  const { tierLimits } = loaderData;
  const isSubmitting = useIsPending();
  const isRestricted = tierLimits?.tier === 'temp';
  const isDisabled = isRestricted || isSubmitting;

  const methods = useRemixForm<NewLiveSessionSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      organizationId: params.organizationId,
      visibility: 'public',
      sessionType: 'manual_start',
      allowLateJoin: true,
      showLeaderboard: true,
      enableChat: false,
      enableReactions: true,
    },
  });

  const visibility = methods.watch('visibility');
  const sessionType = methods.watch('sessionType');

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title='Create Live Session 🎮'
          closeRoute={`/${params.organizationId}/live-sessions`}
        />
        <Modal.Body>
          {isRestricted ? (
            <BannerCard
              message='Live sessions are not available on your current plan'
              description='Upgrade your plan to create, edit, and manage live sessions.'
              showCloseIcon={false}
              variant='restricted'
              cta={{
                to: `/${params.organizationId}/dashboard/subscriptions`,
                children: 'Upgrade Plan',
              }}
            />
          ) : (
            <RemixFormProvider {...methods}>
              <Form method='POST' onSubmit={methods.handleSubmit}>
                <HoneypotInputs />

                {/* Session Name */}
                <GoInputField
                  name='name'
                  labelProps={{ children: 'Session Name' }}
                  inputProps={{
                    autoFocus: true,
                    placeholder: 'e.g. Daily Trivia',
                    disabled: isDisabled,
                  }}
                  description='Give your session a catchy, descriptive name.'
                />

                {/* Description */}
                <GoTextAreaField
                  name='description'
                  labelProps={{ children: 'Description (Optional)' }}
                  textareaProps={{
                    placeholder: 'Brief description of what participants can expect...',
                    rows: 3,
                    disabled: isDisabled,
                  }}
                  description='Help participants understand what this session is about.'
                />

                {/* Session Type */}
                <GoSelectInputField
                  name='sessionType'
                  labelProps={{ children: 'Session Type' }}
                  selectProps={{
                    disabled: isDisabled,
                    placeholder: 'Select session type',
                    options: [
                      {
                        value: 'manual_start',
                        label: 'Manual Start - Host controls when session begins',
                      },
                      {
                        value: 'auto_start',
                        label: 'Auto Start - Session starts automatically at scheduled time',
                      },
                    ],
                  }}
                  description='Choose how your session will start.'
                />

                {/* Scheduled Start Time (required for auto_start) */}
                {sessionType === 'auto_start' && (
                  <GoInputField
                    name='scheduledStartTime'
                    labelProps={{ children: 'Scheduled Start Time' }}
                    inputProps={{
                      type: 'datetime-local',
                      disabled: isDisabled,
                      min: new Date().toISOString().slice(0, 16),
                    }}
                    description='Session will automatically start at this time.'
                  />
                )}

                {/* Visibility */}
                <GoSelectInputField
                  name='visibility'
                  labelProps={{ children: 'Visibility' }}
                  selectProps={{
                    disabled: isDisabled,
                    placeholder: 'Select visibility',
                    options: [
                      {
                        value: 'public',
                        label: 'Public - Anyone with the code can join',
                      },
                      {
                        value: 'unlisted',
                        label: 'Unlisted - Hidden from listings, code access only',
                      },
                      {
                        value: 'private',
                        label: 'Private - Requires session key (password)',
                      },
                    ],
                  }}
                  description='Control who can join this session.'
                />

                {/* Session Key (for private sessions) */}
                {visibility === 'private' && (
                  <GoInputField
                    name='sessionKey'
                    labelProps={{ children: 'Session Key (Password)' }}
                    inputProps={{
                      type: 'text',
                      placeholder: 'Enter a password for this session',
                      disabled: isDisabled,
                    }}
                    description='Participants will need this key to join the private session.'
                  />
                )}

                {/* Max Participants */}
                <GoInputField
                  name='maxParticipants'
                  labelProps={{ children: 'Max Participants (Optional)' }}
                  inputProps={{
                    type: 'number',
                    placeholder: 'e.g. 100',
                    min: 1,
                    max: 1000,
                    disabled: isDisabled,
                  }}
                  description='Leave empty for unlimited participants (up to 1000).'
                />

                {/* Settings Checkboxes */}
                {/* <div className='space-y-3 rounded-lg border p-4'>
              <h3 className='text-sm font-semibold'>Session Settings</h3>

              <GoCheckBoxField
                name='allowLateJoin'
                labelProps={{ children: 'Allow participants to join after the session starts' }}
                checkboxProps={{
                  disabled: isSubmitting,
                }}
              />

              <GoCheckBoxField
                name='showLeaderboard'
                labelProps={{ children: 'Show real-time leaderboard to participants' }}
                checkboxProps={{
                  disabled: isSubmitting,
                }}
              />

              <GoCheckBoxField
                name='enableChat'
                labelProps={{ children: 'Enable live chat' }}
                checkboxProps={{
                  disabled: isSubmitting,
                }}
              />

              <GoCheckBoxField
                name='enableReactions'
                labelProps={{ children: 'Enable emoji reactions' }}
                checkboxProps={{
                  disabled: isSubmitting,
                }}
              />
            </div> */}

                <div className='flex justify-end gap-2'>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={() => window.history.back()}
                    disabled={isDisabled}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={isDisabled}
                    isLoading={isSubmitting}
                    rightIcon={<ChevronRight />}
                  >
                    Create Session
                  </Button>
                </div>
              </Form>
            </RemixFormProvider>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
