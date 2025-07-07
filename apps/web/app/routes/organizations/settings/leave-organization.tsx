import { Form, useNavigate, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, Trash2 } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { leaveOrganization } from '@gonasi/database/organizations';
import {
  ExitOrganizationSchema,
  type ExitOrganizationSchemaTypes,
} from '@gonasi/schemas/organizations';

import type { Route } from './+types/leave-organization';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import type { OrganizationsOutletContextType } from '~/routes/layouts/organizations/organizations-layout';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Leave Organization • Gonasi' },
    { name: 'description', content: 'Confirm and process leaving your organization on Gonasi.' },
  ];
}

const resolver = zodResolver(ExitOrganizationSchema);

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { errors, data } = await getValidatedFormData(formData, resolver);
  if (errors) return dataWithError(null, 'Invalid submission. Please try again.');

  const { supabase } = createClient(request);
  const result = await leaveOrganization({ supabase, data });

  if (!result.success) return dataWithError(null, result.message);

  return redirectWithSuccess(`/`, 'You’ve left the organization.');
}

export default function LeaveOrganization({ params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const {
    data: {
      organization: { name },
    },
  } = useOutletContext<OrganizationsOutletContextType>();

  const methods = useRemixForm<ExitOrganizationSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: { organizationId: params.organizationId },
  });

  const isPending = useIsPending();
  const isDisabled = isPending || methods.formState.isSubmitting;
  const closeRoute = `/${params.organizationId}/settings/organization-danger`;

  const handleClose = () => navigate(closeRoute);

  const heading = `Leave ${name}?`;
  const description =
    'You’ll immediately lose access to this organization and its data. This action cannot be undone.';

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header closeRoute={closeRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <div className='text-center'>
                <CircleAlert className='text-danger mx-auto mb-4 h-12 w-12' />
                <h2 className='font-secondary text-muted-foreground'>{heading}</h2>
                <p className='font-secondary text-muted-foreground pt-2 text-xs'>{description}</p>

                <div className='mt-6 flex flex-col items-center space-y-4'>
                  <Button
                    type='submit'
                    disabled={isDisabled}
                    isLoading={isDisabled}
                    variant='danger'
                    rightIcon={<Trash2 />}
                    className='w-full'
                  >
                    Confirm and Leave
                  </Button>
                  <Button
                    type='button'
                    disabled={isDisabled}
                    variant='ghost'
                    onClick={handleClose}
                    className='w-full'
                  >
                    Go back
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
