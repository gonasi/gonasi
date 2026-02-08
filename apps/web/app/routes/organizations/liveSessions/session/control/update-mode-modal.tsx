import { memo } from 'react';
import { Form, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, FlaskConical, TvMinimalPlay } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { setLiveSessionToLive, setLiveSessionToTest } from '@gonasi/database/liveSessions';
import {
  UpdateLiveSessionModeSchema,
  type UpdateLiveSessionModeSchemaTypes,
} from '@gonasi/schemas/liveSessions';

import type { Route } from './+types/update-mode-modal';

import { BannerCard } from '~/components/cards';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(UpdateLiveSessionModeSchema);

export function meta() {
  return [
    { title: 'Update Session Mode • Gonasi' },
    {
      name: 'description',
      content:
        'Switch your live session between test and live mode on Gonasi. Test mode allows you to preview before going live with participants.',
    },
  ];
}

const Tag = memo(
  ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <span className={`bg-card/50 text-foreground rounded px-1 py-0.5 font-medium ${className}`}>
      {children}
    </span>
  ),
);
Tag.displayName = 'Tag';

export async function action({ params, request }: Route.ActionArgs) {
  // Parse form data and run spam protection
  const formData = await request.formData();
  await checkHoneypot(formData);

  // Initialize Supabase client and validate the form data
  const { supabase } = createClient(request);
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<UpdateLiveSessionModeSchemaTypes>(formData, resolver);

  // If validation errors exist, return them along with default values
  if (errors) return { errors, defaultValues };

  const redirectTo = `/${params.organizationId}/live-sessions/${params.sessionId}/control`;

  // Define handlers for different mode types
  const modeHandlers = {
    test: setLiveSessionToTest,
    live: setLiveSessionToLive,
  };

  const handler = modeHandlers[data.setToMode as keyof typeof modeHandlers];

  if (!handler) {
    return dataWithError(null, 'Unknown mode found');
  }

  const result = await handler({
    supabase,
    sessionId: params.sessionId,
    organizationId: params.organizationId,
  });

  console.log('****** got here: result: ', result);

  return result.success
    ? redirectWithSuccess(redirectTo, result.message)
    : dataWithError(null, result.message);
}

export default function UpdateModeModal({ params }: Route.ComponentProps) {
  const { organizationId, sessionId } = params;

  const { mode } = useOutletContext<{ mode: 'test' | 'live' }>() ?? {};

  const isPending = useIsPending();

  const closeRoute = `/${organizationId}/live-sessions/${sessionId}/control`;

  const isLive = mode === 'live';
  const nextMode = isLive ? 'Test' : 'Live';

  const methods = useRemixForm<UpdateLiveSessionModeSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: { setToMode: isLive ? 'test' : 'live' },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header closeRoute={closeRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />
              <div className='flex items-center justify-center pb-4'>
                <CircleAlert className={cn(isLive ? 'text-secondary' : 'text-primary')} size={40} />
              </div>

              <h2 className='text-center text-xl'>Switch to {nextMode} Mode?</h2>
              <p className='text-muted-foreground font-secondary text-center'>
                {`You're currently in `} <Tag>{capitalize(isLive ? 'Live' : 'Test')}</Tag> mode.{' '}
                {isLive
                  ? 'Switching to Test mode lets you preview changes safely.'
                  : 'Switching to Live mode opens your session to real participants.'}
              </p>

              <div className='space-y-3 py-6'>
                <ul className='text-muted-foreground font-secondary list-disc space-y-3 pl-5 leading-relaxed'>
                  {isLive ? (
                    <>
                      <li>
                        Your session will be reset to <Tag>draft status</Tag> so you can make
                        changes and test freely.
                      </li>
                      <li>
                        All <Tag className='bg-danger/10'>live participant data</Tag>,{' '}
                        <Tag className='bg-danger/10'>responses</Tag>, and{' '}
                        <Tag className='bg-danger/10'>analytics</Tag> will be permanently deleted.
                      </li>
                      <li>
                        Test mode allows you to preview questions and test session flow without
                        affecting live data.
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        Your session will be reset to <Tag>draft status</Tag> and ready for real
                        participants.
                      </li>
                      <li>
                        All <Tag className='bg-danger/10'>test responses</Tag> will be cleared to
                        start fresh.
                      </li>
                      <li>
                        In Live mode, participant responses and analytics will be saved permanently
                        for review.
                      </li>
                    </>
                  )}
                </ul>

                <BannerCard
                  showCloseIcon={false}
                  variant='error'
                  message='This action cannot be undone. All existing data will be permanently deleted.'
                />
              </div>

              <div className='px-1 py-4'>
                <Button
                  variant={isLive ? 'secondary' : 'default'}
                  className='w-full'
                  leftIcon={isLive ? <FlaskConical /> : <TvMinimalPlay />}
                  type='submit'
                  disabled={isDisabled}
                  isLoading={isDisabled}
                >
                  Switch to {nextMode} Mode
                </Button>
              </div>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
