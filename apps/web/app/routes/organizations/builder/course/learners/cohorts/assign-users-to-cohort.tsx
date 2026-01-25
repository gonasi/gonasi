import { Form, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import {
  AssignUsersToCohortSchema,
  type AssignUsersToCohortSchemaTypes,
} from '@gonasi/schemas/cohorts';

import type { Route } from './+types/assign-users-to-cohort';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(AssignUsersToCohortSchema);

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // TODO: Fetch cohort data
  // const cohort = await fetchCohortById(supabase, params.cohortId);

  // TODO: Fetch available users (enrollments without cohort or from different cohorts)
  // const availableUsers = await fetchEnrollmentsForCourse(supabase, params.courseId);

  // if (!cohort) {
  //   return redirectWithError(
  //     `/${params.organizationId}/builder/${params.courseId}/learners/cohorts`,
  //     'Cohort not found.',
  //   );
  // }

  return {
    cohort: { id: params.cohortId, name: 'Sample Cohort' },
    availableUsers: [],
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<AssignUsersToCohortSchemaTypes>(formData, resolver);

  if (errors) return { errors, defaultValues };

  // TODO: Implement assignUserToCohort function
  // Loop through selected enrollment IDs and assign them to the cohort
  // const results = await Promise.all(
  //   data.enrollmentIds.map(id => assignUserToCohort(supabase, id, params.cohortId))
  // );

  const redirectTo = `/${params.organizationId}/builder/${params.courseId}/learners/cohorts`;

  // const successCount = results.filter(r => r.success).length;
  // return redirectWithSuccess(
  //   redirectTo,
  //   `${successCount} user(s) assigned to cohort successfully!`
  // );

  return redirectWithSuccess(redirectTo, 'Users assigned to cohort successfully!');
}

export default function AssignUsersToCohort({ loaderData, params }: Route.ComponentProps) {
  const { cohort, availableUsers } = loaderData;
  const navigate = useNavigate();
  const isPending = useIsPending();

  const closeRoute = `/${params.organizationId}/builder/${params.courseId}/learners/cohorts`;

  const methods = useRemixForm<AssignUsersToCohortSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      cohortId: cohort.id,
      enrollmentIds: [],
    },
  });

  return (
    <Modal open>
      <Modal.Content size='lg'>
        <Modal.Header title={`Assign Users to ${cohort.name}`} closeRoute={closeRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <div className='space-y-4'>
                {/* TODO: Add user selection interface */}
                <p className='text-muted-foreground'>User selection interface coming soon...</p>
                <p className='text-muted-foreground text-sm'>
                  Select users from the course enrollments to add them to this cohort.
                </p>
              </div>

              <Modal.Footer>
                <Button type='button' variant='outline' onClick={() => navigate(closeRoute)}>
                  Cancel
                </Button>
                <Button type='submit' disabled={isPending}>
                  {isPending ? 'Assigning...' : 'Assign Users'}
                </Button>
              </Modal.Footer>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
