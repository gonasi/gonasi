import { Form, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { EditCohortSchema, type EditCohortSchemaTypes } from '@gonasi/schemas/cohorts';

import type { Route } from './+types/edit-cohort';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(EditCohortSchema);

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  // TODO: Fetch cohort data
  // const cohort = await fetchCohortById(supabase, params.cohortId);

  // if (!cohort) {
  //   return redirectWithError(
  //     `/${params.organizationId}/builder/${params.courseId}/learners/cohorts`,
  //     'Cohort not found.',
  //   );
  // }

  return { cohort: { id: params.cohortId, name: 'Sample Cohort' } };
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditCohortSchemaTypes>(formData, resolver);

  if (errors) return { errors, defaultValues };

  // TODO: Implement updateCohort function
  // const result = await updateCohort(supabase, params.cohortId, data);

  const redirectTo = `/${params.organizationId}/builder/${params.courseId}/learners/cohorts`;

  // return result.success
  //   ? redirectWithSuccess(redirectTo, result.message)
  //   : dataWithError(null, result.message);

  return redirectWithSuccess(redirectTo, 'Cohort updated successfully!');
}

export default function EditCohort({ loaderData, params }: Route.ComponentProps) {
  const { cohort } = loaderData;
  const navigate = useNavigate();
  const isPending = useIsPending();

  const closeRoute = `/${params.organizationId}/builder/${params.courseId}/learners/cohorts`;

  const methods = useRemixForm<EditCohortSchemaTypes>({
    mode: 'all',
    resolver,
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
                {/* TODO: Add form fields for cohort editing */}
                <p className='text-muted-foreground'>Form fields coming soon...</p>
              </div>

              <Modal.Footer>
                <Button type='button' variant='ghost' onClick={() => navigate(closeRoute)}>
                  Cancel
                </Button>
                <Button type='submit' disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </Modal.Footer>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
