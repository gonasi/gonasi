import { Form, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight, Mail } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import {
  canResendOrganizationInvite,
  getUserOrgRole,
  resendOrganizationInvite,
} from '@gonasi/database/organizations';
import {
  ResendInviteToOrganizationEmailSchema,
  type ResendInviteToOrganizationEmailSchemaTypes,
} from '@gonasi/schemas/organizations';

import type { Route } from './+types/resend-invite';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import type { OrganizationsOutletContextType } from '~/routes/layouts/organizations/organizations-layout';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Resend Invite • Gonasi' },
    {
      name: 'description',
      content:
        'Resend a pending invite to a team member on Gonasi. Collaborate on building engaging learning experiences.',
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const { organizationId, token } = params;

  const role = await getUserOrgRole({ supabase, organizationId });

  if (!role || role === 'editor') {
    return redirectWithError(
      `/${organizationId}/members`,
      'You are not allowed to view this page.',
    );
  }

  const { canResend, reason, invite } = await canResendOrganizationInvite({
    supabase,
    organizationId,
    token,
  });

  return {
    canResend,
    reason,
    inviteEmail: invite?.email ?? '',
  };
}

const resolver = zodResolver(ResendInviteToOrganizationEmailSchema);

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { errors, data } = await getValidatedFormData(formData, resolver);
  if (errors) {
    return dataWithError(null, 'Invalid submission. Please try again later.');
  }

  const { supabase } = createClient(request);
  const result = await resendOrganizationInvite({ supabase, data });

  if (!result.success) {
    return dataWithError(null, result.message);
  }

  return redirectWithSuccess(
    `/${params.organizationId}/members/invites`,
    'Invitation email re-sent.',
  );
}

export default function ResendInvite({ params, loaderData }: Route.ComponentProps) {
  const {
    data: {
      member: { role },
    },
  } = useOutletContext<OrganizationsOutletContextType>();

  const { canResend, reason, inviteEmail } = loaderData;

  const isPending = useIsPending();

  const methods = useRemixForm<ResendInviteToOrganizationEmailSchemaTypes>({
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
          title={canResend ? 'Resend Organization Invite' : 'Unable to Resend Invite'}
          closeRoute={`/${params.organizationId}/members/invites`}
        />
        <Modal.Body className='px-4'>
          {role === 'editor' && (
            <p className='text-muted-foreground text-sm font-medium'>
              You don’t have permission to resend invites.
            </p>
          )}
          {canResend ? (
            <RemixFormProvider {...methods}>
              <Form method='POST' onSubmit={methods.handleSubmit} noValidate>
                <HoneypotInputs />
                <div className='text-muted-foreground flex items-center gap-2 pb-4 text-sm'>
                  <span>Resend invite to:</span>
                  <Mail className='text-muted-foreground h-4 w-4' />
                  <span className='text-foreground font-secondary font-medium'>{inviteEmail}</span>
                </div>

                <Button
                  type='submit'
                  disabled={isDisabled}
                  isLoading={isDisabled}
                  rightIcon={<ChevronRight />}
                >
                  Resend Invite
                </Button>
              </Form>
            </RemixFormProvider>
          ) : (
            <div className='border-muted bg-muted/40 text-muted-foreground rounded-xl border p-4 text-sm'>
              <p className='text-foreground mb-1 font-medium'>Can’t Resend Invite</p>
              <p className='font-secondary'>{reason}</p>
            </div>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
