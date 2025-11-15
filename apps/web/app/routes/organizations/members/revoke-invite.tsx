import { Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight, Mail } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import {
  canRevokeOrganizationInvite,
  revokeOrganizationInvite,
} from '@gonasi/database/organizations';
import {
  RevokeInviteToOrganizationSchema,
  type RevokeInviteToOrganizationSchemaTypes,
} from '@gonasi/schemas/organizations';

import type { Route } from './+types/revoke-invite';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Revoke Invite • Gonasi' },
    {
      name: 'description',
      content:
        'Revoke a pending invite for a team member on Gonasi. Manage your organization’s membership effectively.',
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const organizationId = params.organizationId!;
  const token = params.token!;

  const { canRevoke, reason, invite } = await canRevokeOrganizationInvite({
    supabase,
    organizationId,
    token,
  });

  return {
    canRevoke,
    reason,
    inviteEmail: invite?.email ?? '',
  };
}

const resolver = zodResolver(RevokeInviteToOrganizationSchema);

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { errors, data } = await getValidatedFormData(formData, resolver);
  if (errors) {
    return dataWithError(null, 'Invalid submission. Please try again later.');
  }

  const { supabase } = createClient(request);
  const result = await revokeOrganizationInvite({ supabase, data });

  if (!result.success) {
    return dataWithError(null, result.message);
  }

  return redirectWithSuccess(
    `/${params.organizationId}/members/invites`,
    'Invite successfully revoked.',
  );
}

export default function RevokeInvite({ params, loaderData }: Route.ComponentProps) {
  const { canRevoke, reason, inviteEmail } = loaderData;

  const isPending = useIsPending();

  const methods = useRemixForm<RevokeInviteToOrganizationSchemaTypes>({
    mode: 'all',
    defaultValues: {
      organizationId: params.organizationId,
      token: params.token,
    },
    resolver,
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title={canRevoke ? 'Revoke Organization Invite' : 'Unable to Revoke Invite'}
          closeRoute={`/${params.organizationId}/members/invites`}
        />
        <Modal.Body className='px-4'>
          {canRevoke ? (
            <RemixFormProvider {...methods}>
              <Form method='POST' onSubmit={methods.handleSubmit} noValidate>
                <HoneypotInputs />
                <div className='text-muted-foreground flex items-center gap-2 pb-4 text-sm'>
                  <span>Revoke invite for user:</span>
                  <Mail className='text-muted-foreground h-4 w-4' />
                  <span className='text-foreground font-secondary font-medium'>{inviteEmail}</span>
                </div>

                <Button
                  type='submit'
                  variant='danger'
                  disabled={isDisabled}
                  isLoading={isDisabled}
                  rightIcon={<ChevronRight />}
                >
                  Revoke Invite
                </Button>
              </Form>
            </RemixFormProvider>
          ) : (
            <div className='border-muted bg-muted/40 text-muted-foreground rounded-xl border p-4 text-sm'>
              <p className='text-foreground mb-1 font-medium'>Can’t Revoke Invite</p>
              <p className='font-secondary'>{reason}</p>
            </div>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
