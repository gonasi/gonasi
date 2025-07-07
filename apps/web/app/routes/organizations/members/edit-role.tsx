import { Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import {
  fetchOrganizationMemberById,
  getUserOrgRole,
  updateOrganizationMemberRole, // ✅ replace with your real DB method
} from '@gonasi/database/organizations';
import {
  OrganizationRoleOptions,
  UpdateMemberRoleSchema,
  type UpdateMemberRoleSchemaTypes,
} from '@gonasi/schemas/organizations';

import type { Route } from './+types/edit-role';

import { Button } from '~/components/ui/button';
import { GoSelectInputField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Update Member Role • Gonasi' },
    {
      name: 'description',
      content:
        'Change the role of a team member in your organization. Keep your team permissions up to date with ease.',
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const organizationId = params.organizationId!;
  const memberId = params.memberId!;

  const role = await getUserOrgRole({ supabase, organizationId });

  if (!role || role !== 'editor') {
    return redirectWithError(
      `/${organizationId}/members/active-members`,
      'You are not allowed to view this page.',
    );
  }

  const member = await fetchOrganizationMemberById({
    supabase,
    memberId,
  });

  if (!member || member.organization_id !== organizationId) {
    return redirectWithError(
      `/${organizationId}/members/active-members`,
      'That member could not be found.',
    );
  }

  return member;
}

const resolver = zodResolver(UpdateMemberRoleSchema);

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { errors, data } = await getValidatedFormData(formData, resolver);
  if (errors) {
    return dataWithError(null, 'Invalid submission. Please try again.');
  }

  const { supabase } = createClient(request);
  const result = await updateOrganizationMemberRole({ supabase, data });

  if (!result.success) {
    return dataWithError(null, result.message || 'Failed to update role.');
  }

  return redirectWithSuccess(
    `/${params.organizationId}/members/active-members`,
    'Member role updated successfully.',
  );
}

export default function EditMemberRole({ params, loaderData }: Route.ComponentProps) {
  const isPending = useIsPending();

  const methods = useRemixForm<UpdateMemberRoleSchemaTypes>({
    mode: 'all',
    defaultValues: {
      organizationId: params.organizationId,
      memberId: params.memberId,
      role: loaderData.role,
    },
    resolver,
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='Update Member Role'
          closeRoute={`/${params.organizationId}/members/active-members`}
        />
        <Modal.Body className='px-4'>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit} noValidate>
              <HoneypotInputs />
              <GoSelectInputField
                labelProps={{ children: 'User Role', required: true }}
                name='role'
                description='Assign the appropriate role for this member 👤'
                selectProps={{
                  placeholder: 'Select a user role',
                  options: OrganizationRoleOptions,
                }}
              />
              <Button
                type='submit'
                disabled={isDisabled || !methods.formState.isDirty}
                isLoading={isDisabled}
              >
                Update Role
              </Button>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
