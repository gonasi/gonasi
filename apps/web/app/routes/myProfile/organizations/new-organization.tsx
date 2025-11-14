import { Form, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { createNewOrganization } from '@gonasi/database/organizations';
import {
  NewOrganizationSchema,
  type NewOrganizationSchemaTypes,
} from '@gonasi/schemas/organizations';

import type { Route } from './+types/new-organization';

import { Button } from '~/components/ui/button';
import { GoInputField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Create Organization • Gonasi' },
    {
      name: 'description',
      content:
        'Set up your organization on Gonasi to start offering courses, managing teams, and growing your learning community.',
    },
  ];
}

const resolver = zodResolver(NewOrganizationSchema);

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  // Prevent bot submissions
  await checkHoneypot(formData);

  const { errors, data } = await getValidatedFormData(formData, resolver);
  if (errors) {
    return dataWithError(null, 'Something went wrong. Please try again.');
  }

  const { supabase } = createClient(request);
  const result = await createNewOrganization(supabase, data);

  if (!result.success) {
    return dataWithError(null, result.message);
  }

  return redirectWithSuccess(`/${result.data}/dashboard`, result.message);
}

export default function NewOrganization({ params }: Route.ComponentProps) {
  const isPending = useIsPending();
  const { canCreateNewOrg } = useOutletContext<{ canCreateNewOrg: boolean }>();

  const methods = useRemixForm<NewOrganizationSchemaTypes>({
    mode: 'all',
    resolver,
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title={
            canCreateNewOrg ? 'Create a New Organization' : 'Upgrade an Organization to Continue'
          }
          closeRoute={`/go/${params.username}/organizations`}
        />
        <Modal.Body className='px-4'>
          {canCreateNewOrg ? (
            <RemixFormProvider {...methods}>
              <Form method='POST' onSubmit={methods.handleSubmit}>
                <HoneypotInputs />

                <GoInputField
                  labelProps={{ children: 'Organization Name', required: true }}
                  name='name'
                  inputProps={{ autoFocus: true, disabled: isDisabled }}
                  description='What is your organization called? This will be visible on your public profile.'
                />

                <GoInputField
                  labelProps={{ children: 'Organization Handle', required: true }}
                  name='handle'
                  inputProps={{ className: 'lowercase', disabled: isDisabled }}
                  description='A short, unique ID for your organization (e.g. `gonasi-academy`). Used in your URL.'
                />

                <Button
                  type='submit'
                  disabled={isPending}
                  isLoading={isDisabled}
                  rightIcon={<ChevronRight />}
                >
                  Save & Continue
                </Button>
              </Form>
            </RemixFormProvider>
          ) : (
            <div className='border-muted bg-muted/40 text-muted-foreground rounded-xl border p-4 text-sm'>
              <p className='text-foreground mb-1 font-medium'>
                You’ve reached your organization limit.
              </p>
              <p className='font-secondary'>
                You can only own <strong>one Launch organization</strong> and{' '}
                <strong>one temporary organization</strong>. To create another, upgrade your
                existing organization to a paid tier.
              </p>
            </div>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
