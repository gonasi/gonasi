import { Form, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, Trash2 } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import {
  deleteOrganizationMember,
  fetchOrganizationMemberById,
  getUserOrgRole,
} from '@gonasi/database/organizations';
import {
  DeleteMemberFromOrganizationSchema,
  type DeleteMemberFromOrganizationSchemaTypes,
} from '@gonasi/schemas/organizations';

import type { Route } from './+types/edit-role';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Delete Member • Gonasi' },
    {
      name: 'description',
      content: 'Remove a member from your organization.',
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const organizationId = params.organizationId!;
  const memberId = params.memberId!;

  const role = await getUserOrgRole({ supabase, organizationId });

  if (!role || role === 'editor') {
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

const resolver = zodResolver(DeleteMemberFromOrganizationSchema);

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { errors, data } = await getValidatedFormData(formData, resolver);
  if (errors) {
    return dataWithError(null, 'Invalid submission. Please try again.');
  }

  const { supabase } = createClient(request);
  const result = await deleteOrganizationMember({ supabase, data });

  if (!result.success) {
    return dataWithError(null, result.message || 'Failed to delete member.');
  }

  return redirectWithSuccess(
    `/${params.organizationId}/members/active-members`,
    'Member deleted successfully.',
  );
}

export default function DeleteMemberFromOrg({ params, loaderData }: Route.ComponentProps) {
  const isPending = useIsPending();
  const navigate = useNavigate();

  const methods = useRemixForm<DeleteMemberFromOrganizationSchemaTypes>({
    mode: 'all',
    defaultValues: {
      organizationId: loaderData.organization_id,
      memberId: loaderData.user_id,
    },
    resolver,
  });

  const isDisabled = isPending || methods.formState.isSubmitting;
  const closeRoute = `/${params.organizationId}/members/active-members`;

  const handleClose = () => navigate(closeRoute);

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header title='Delete Member' closeRoute={closeRoute} />
        <Modal.Body className='px-4'>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit} noValidate>
              <HoneypotInputs />
              <div className='text-center'>
                <CircleAlert className='text-danger mx-auto mb-4 h-12 w-12' />
                <h2 className='font-secondary text-muted-foreground'>Remove This Member?</h2>
                <p className='font-secondary text-muted-foreground pt-2 text-xs'>
                  This action is permanent and will revoke access immediately.
                </p>

                <div className='mt-6 flex flex-col items-center space-y-4'>
                  <Button
                    type='submit'
                    disabled={isDisabled}
                    isLoading={isDisabled}
                    variant='danger'
                    rightIcon={<Trash2 />}
                    className='w-full'
                  >
                    Confirm Deletion
                  </Button>
                  <Button
                    type='button'
                    disabled={isDisabled}
                    variant='ghost'
                    onClick={handleClose}
                    className='w-full'
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
