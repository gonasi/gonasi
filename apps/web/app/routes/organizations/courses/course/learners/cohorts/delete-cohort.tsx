import { Form, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { deleteCohort, fetchCohortById } from '@gonasi/database/cohorts';
import { DeleteCohortSchema, type DeleteCohortSchemaTypes } from '@gonasi/schemas/cohorts';

import type { Route } from './+types/delete-cohort';

import { DeleteConfirmationLayout } from '~/components/layouts/modals';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(DeleteCohortSchema);

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

  return { cohort: { id: cohort.id, name: cohort.name } };
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase, headers } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<DeleteCohortSchemaTypes>(formData, resolver);

  if (errors) return { errors, defaultValues };

  const result = await deleteCohort(supabase, data.cohortId);

  const redirectTo = `/${params.organizationId}/courses/${params.courseId}/learners/cohorts`;

  return result.success
    ? redirectWithSuccess(redirectTo, result.message, { headers })
    : dataWithError(null, result.message, { headers });
}

export default function DeleteCohort({ loaderData, params }: Route.ComponentProps) {
  const { cohort } = loaderData;
  const navigate = useNavigate();
  const isPending = useIsPending();

  const closeRoute = `/${params.organizationId}/courses/${params.courseId}/learners/cohorts`;

  const methods = useRemixForm<DeleteCohortSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      cohortId: cohort.id,
    },
  });

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header title='Delete Cohort' closeRoute={closeRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <DeleteConfirmationLayout
                titlePrefix='Are you sure you want to delete the cohort:'
                title={cohort.name}
                isLoading={isPending}
                handleClose={() => navigate(closeRoute)}
              />
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
