import { Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { fetchCohortById, updateCohort } from '@gonasi/database/cohorts';
import { EditCohortSchema, type EditCohortSchemaTypes } from '@gonasi/schemas/cohorts';

import type { Route } from './+types/edit-cohort';

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

const formResolver = zodResolver(EditCohortSchema);

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);

  const cohort = await fetchCohortById(supabase, params.cohortId);

  if (!cohort) {
    return redirectWithError(
      `/${params.organizationId}/courses/${params.courseId}/learners/cohorts`,
      'Cohort not found.',
      { headers },
    );
  }

  return {
    cohort: {
      name: cohort.name,
      description: cohort.description,
      startDate: cohort.start_date ? new Date(cohort.start_date).toISOString() : undefined,
      endDate: cohort.end_date ? new Date(cohort.end_date).toISOString() : undefined,
      maxEnrollment: cohort.max_enrollment,
      isActive: cohort.is_active,
    },
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase, headers } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditCohortSchemaTypes>(formData, formResolver);

  if (errors) return { errors, defaultValues };

  const result = await updateCohort(supabase, params.cohortId, {
    name: data.name,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    maxEnrollment: data.maxEnrollment,
    isActive: data.isActive,
  });

  const redirectTo = `/${params.organizationId}/courses/${params.courseId}/learners/cohorts`;

  return result.success
    ? redirectWithSuccess(redirectTo, result.message, { headers })
    : dataWithError({ errors: defaultValues }, result.message, { headers });
}

export default function EditCohort({ loaderData, params }: Route.ComponentProps) {
  const { cohort } = loaderData;
  const isPending = useIsPending();

  const closeRoute = `/${params.organizationId}/courses/${params.courseId}/learners/cohorts`;

  const methods = useRemixForm<EditCohortSchemaTypes>({
    mode: 'all',
    resolver: formResolver,
    defaultValues: cohort,
  });

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title='Edit Cohort' closeRoute={closeRoute} />
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
                  description="Optional: Add a short description of the cohort's purpose or focus."
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
                    {isPending ? 'Updating...' : 'Update Cohort'}
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
