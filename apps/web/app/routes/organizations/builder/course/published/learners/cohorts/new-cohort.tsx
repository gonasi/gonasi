import { Form, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { createCohort } from '@gonasi/database/cohorts';
import { type NewCohortSchemaTypes, SubmitNewCohortSchema } from '@gonasi/schemas/cohorts';

import type { Route } from './+types/new-cohort';

import { Button } from '~/components/ui/button';
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

const resolver = zodResolver(SubmitNewCohortSchema);

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase, headers } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<NewCohortSchemaTypes>(formData, resolver);

  if (errors) return { errors, defaultValues };

  const result = await createCohort(supabase, {
    organizationId: data.organizationId,
    publishedCourseId: data.publishedCourseId,
    name: data.name,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    maxEnrollment: data.maxEnrollment,
    isActive: data.isActive,
  });

  const redirectTo = `/${params.organizationId}/builder/${params.courseId}/published/learners/cohorts`;

  return result.success
    ? redirectWithSuccess(redirectTo, result.message, { headers })
    : dataWithError({ errors: defaultValues }, result.message, { headers });
}

export default function NewCohort({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const isPending = useIsPending();

  const closeRoute = `/${params.organizationId}/builder/${params.courseId}/published/learners/cohorts`;

  const methods = useRemixForm<NewCohortSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      name: '',
      description: null,
      startDate: null,
      endDate: null,
      maxEnrollment: null,
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
                  labelProps={{ children: 'Cohort Name' }}
                  inputProps={{
                    placeholder: 'e.g., Fall 2024, Beginners Group A',
                    autoComplete: 'off',
                  }}
                />

                <GoTextAreaField
                  name='description'
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
                  />

                  <GoCalendar26 name='endDate' labelProps={{ children: 'End Date (Optional)' }} />
                </div>

                <GoInputField
                  name='maxEnrollment'
                  // type='number'
                  labelProps={{ children: 'Max Enrollment (Optional)' }}
                  inputProps={{
                    placeholder: 'Leave empty for unlimited',
                    min: 1,
                  }}
                />

                <GoSwitchField
                  name='isActive'
                  labelProps={{ children: 'Active' }}
                  description='Cohort is active'
                />

                {/* Hidden fields for organizationId and publishedCourseId */}
                <input type='hidden' name='organizationId' value={params.organizationId} />
                <input type='hidden' name='publishedCourseId' value={params.courseId} />
              </div>

              <Modal.Footer>
                <Button type='button' variant='secondary' onClick={() => navigate(closeRoute)}>
                  Cancel
                </Button>
                <Button type='submit' disabled={isPending}>
                  {isPending ? 'Creating...' : 'Create Cohort'}
                </Button>
              </Modal.Footer>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
