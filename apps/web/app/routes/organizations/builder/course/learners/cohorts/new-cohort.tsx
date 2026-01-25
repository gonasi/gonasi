import { Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { createCohort } from '@gonasi/database/cohorts';
import { NewCohortSchema, type NewCohortSchemaTypes } from '@gonasi/schemas/cohorts';

import type { Route } from './+types/new-cohort';

import { Button, NavLinkButton } from '~/components/ui/button';
import { FormDescription } from '~/components/ui/forms';
import {
  GoCalendar26,
  GoInputField,
  GoSwitchField,
  GoTextAreaField,
} from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const formResolver = zodResolver(NewCohortSchema);

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase, headers } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<NewCohortSchemaTypes>(formData, formResolver);

  if (errors) return { errors, defaultValues };

  const result = await createCohort(supabase, {
    organizationId: params.organizationId,
    publishedCourseId: params.courseId,
    name: data.name,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    maxEnrollment: data.maxEnrollment,
    isActive: data.isActive,
  });

  const redirectTo = `/${params.organizationId}/builder/${params.courseId}/learners/cohorts`;

  return result.success
    ? redirectWithSuccess(redirectTo, result.message, { headers })
    : dataWithError({ errors: defaultValues }, result.message, { headers });
}

export default function NewCohort({ params }: Route.ComponentProps) {
  const isPending = useIsPending();

  const closeRoute = `/${params.organizationId}/builder/${params.courseId}/learners/cohorts`;

  const methods = useRemixForm<NewCohortSchemaTypes>({
    mode: 'all',
    resolver: formResolver,
    defaultValues: {
      name: '',
      description: undefined,
      startDate: undefined,
      endDate: undefined,
      maxEnrollment: undefined,
      isActive: true,
    },
  });

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title='Create New Cohort' closeRoute={closeRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <div className='space-y-4'>
                <GoInputField
                  name='name'
                  description='Give your cohort a clear, descriptive name.'
                  labelProps={{ children: 'Cohort Name' }}
                  inputProps={{
                    placeholder: 'e.g., Fall 2024, Beginners Group A',
                    autoComplete: 'off',
                  }}
                />

                <GoTextAreaField
                  name='description'
                  description='Optional: Add a short description of the cohort’s purpose or focus.'
                  labelProps={{ children: 'Description (Optional)' }}
                  textareaProps={{
                    placeholder: 'Add a brief description of this cohort',
                    rows: 3,
                  }}
                />

                <div className='grid grid-cols-2 gap-4'>
                  <GoCalendar26
                    name='startDate'
                    labelProps={{ children: 'Start Date (Optional)' }}
                    showClearButton
                  />
                  <GoCalendar26
                    name='endDate'
                    labelProps={{ children: 'End Date (Optional)' }}
                    showClearButton
                  />
                </div>
                <div className='-mt-8'>
                  <FormDescription>
                    Start and end dates are informational only. Learner access depends on the
                    enrollment timeline defined in your pricing plan.
                  </FormDescription>
                </div>

                <GoInputField
                  name='maxEnrollment'
                  labelProps={{ children: 'Maximum Enrollment (Optional)' }}
                  inputProps={{
                    placeholder: 'Leave empty for unlimited',
                    min: 1,
                    type: 'number',
                  }}
                  description='Set a recommended maximum number of learners. Exceeding this limit is allowed, but you will receive a warning.'
                />

                <GoSwitchField
                  name='isActive'
                  labelProps={{ children: 'Active' }}
                  description='Toggle to make this cohort active or inactive.'
                />
              </div>

              <Modal.Footer>
                <div className='flex items-center justify-end space-x-4'>
                  <div>
                    <NavLinkButton variant='ghost' to={closeRoute}>
                      Cancel
                    </NavLinkButton>
                  </div>
                  <Button
                    type='submit'
                    disabled={isPending || !methods.formState.isDirty}
                    leftIcon={<Save />}
                  >
                    {isPending ? 'Creating...' : 'Create Cohort'}
                  </Button>
                </div>
              </Modal.Footer>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
