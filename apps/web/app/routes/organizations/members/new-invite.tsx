import { Form, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { inviteOrganizationMember } from '@gonasi/database/organizations';
import {
  InviteMemberToOrganizationSchema,
  type InviteMemberToOrganizationSchemaTypes,
  OrganizationRoleOptions,
} from '@gonasi/schemas/organizations';

import type { Route } from './+types/new-invite';

import { Button } from '~/components/ui/button';
import { GoInputField, GoSelectInputField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import type { OrganizationsOutletContextType } from '~/routes/layouts/organizations/organizations-layout';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Invite Member • Gonasi' },
    {
      name: 'description',
      content:
        'Invite a new member to your organization on Gonasi and collaborate on building and managing engaging learning experiences.',
    },
  ];
}

const resolver = zodResolver(InviteMemberToOrganizationSchema);

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  // Prevent bot submissions
  await checkHoneypot(formData);

  const { errors, data } = await getValidatedFormData(formData, resolver);
  if (errors) {
    return dataWithError(null, 'Invalid email address. Please try again.');
  }

  const { supabase } = createClient(request);

  const result = await inviteOrganizationMember(supabase, data);

  if (!result.success) {
    return dataWithError(null, result.message);
  }

  return redirectWithSuccess(
    `/${params.organizationId}/members/invites`,
    `Invitation sent to ${data.email}`,
  );
}

export default function InviteMember({ params }: Route.ComponentProps) {
  const {
    data: {
      tier_limits: { tier, max_members_per_org },
      permissions: { can_add_org_member },
      member: { role },
    },
  } = useOutletContext<OrganizationsOutletContextType>();

  const isPending = useIsPending();

  const methods = useRemixForm<InviteMemberToOrganizationSchemaTypes>({
    mode: 'all',
    defaultValues: {
      organizationId: params.organizationId,
      role: 'editor',
    },
    resolver,
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title={can_add_org_member ? 'Invite New Member' : 'Member Limit Reached'}
          closeRoute={`/${params.organizationId}/members/invites`}
        />
        <Modal.Body className='px-4'>
          {can_add_org_member ? (
            <RemixFormProvider {...methods}>
              <Form method='POST' onSubmit={methods.handleSubmit} noValidate>
                <HoneypotInputs />

                <GoInputField
                  labelProps={{ children: 'Email', required: true }}
                  name='email'
                  inputProps={{
                    type: 'email',
                    autoFocus: true,
                    disabled: isDisabled,
                    placeholder: 'name@example.com',
                  }}
                  description="Who's joining the team? Drop their email here."
                />

                <GoSelectInputField
                  labelProps={{ children: 'User Role', required: true }}
                  name='role'
                  disabled={role !== 'owner'}
                  description={
                    role !== 'owner'
                      ? 'Only the org owner can invite admins.'
                      : "What's their role going to be? 👤"
                  }
                  selectProps={{
                    placeholder: 'Select a user role',
                    options: OrganizationRoleOptions,
                  }}
                />

                <Button
                  type='submit'
                  disabled={isDisabled}
                  isLoading={isDisabled}
                  rightIcon={<ChevronRight />}
                >
                  Send Invite
                </Button>
              </Form>
            </RemixFormProvider>
          ) : (
            <div className='border-muted bg-muted/40 text-muted-foreground rounded-xl border p-4 text-sm'>
              <p className='text-foreground mb-1 font-medium'>Looks like your team is full.</p>
              <p className='font-secondary'>
                Your current <strong>{tier}</strong> plan allows up to{' '}
                <strong>{max_members_per_org}</strong> members per organization. Need more room?
                Consider upgrading your plan.
              </p>
            </div>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
