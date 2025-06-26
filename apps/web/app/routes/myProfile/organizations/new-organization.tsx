import { Form } from 'react-router';
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
    { title: 'Create Organization | Gonasi' },
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

  // Validate form data using schema resolver
  const { errors, data } = await getValidatedFormData(formData, resolver);
  if (errors) {
    return dataWithError(null, 'Something went wrong. Please try again.');
  }

  const { supabase } = createClient(request);

  // Attempt to create a new organization
  const result = await createNewOrganization(supabase, data);
  if (!result.success) {
    return dataWithError(null, result.message);
  }

  // Redirect to organization settings on success
  return redirectWithSuccess(`/${result.data}/settings/profile`, result.message);
}

export default function NewOrganization() {
  const isPending = useIsPending();

  // Initialize form methods with Remix Hook Form
  const methods = useRemixForm<NewOrganizationSchemaTypes>({
    mode: 'all',
    resolver,
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title='Create a New Organization' />
        <Modal.Body className='px-4'>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              {/* Anti-bot honeypot field */}
              <HoneypotInputs />

              {/* Organization name input field */}
              <GoInputField
                labelProps={{ children: 'Organization Name', required: true }}
                name='name'
                inputProps={{
                  autoFocus: true,
                  disabled: isDisabled,
                }}
                description='What is your organization called? This will be visible on your public profile.'
              />

              {/* Organization handle input field */}
              <GoInputField
                labelProps={{ children: 'Organization Handle', required: true }}
                name='handle'
                inputProps={{
                  className: 'lowercase',
                  disabled: isDisabled,
                }}
                description='A short, unique ID for your organization (e.g. `gonasi-academy`). Used in your URL.'
              />

              {/* Submit button with loading state */}
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
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
