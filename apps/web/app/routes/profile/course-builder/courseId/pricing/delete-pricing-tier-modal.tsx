import { Form, useNavigate, useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { deleteUserLessonById } from '@gonasi/database/lessons';
import { DeleteLessonSchema, type DeleteLessonSchemaTypes } from '@gonasi/schemas/lessons';

import type { Route } from './+types/delete-pricing-tier-modal';

import { DeleteConfirmationLayout } from '~/components/layouts/modals';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(DeleteLessonSchema);

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<DeleteLessonSchemaTypes>(formData, resolver);

  if (errors) return { errors, defaultValues };

  const { success, message } = await deleteUserLessonById(supabase, {
    ...data,
  });

  if (!success) {
    return dataWithError(null, message);
  }

  return redirectWithSuccess(
    `/${params.username}/course-builder/${params.courseId}/content`,
    message,
  );
}

export default function DeletePricingTier({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const params = useParams();

  const handleClose = () =>
    navigate(`/${params.username}/course-builder/${params.courseId}/content`);

  const isPending = useIsPending();

  const methods = useRemixForm<DeleteLessonSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      lessonId: loaderData.id,
    },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          closeRoute={`/${params.username}/course-builder/${params.courseId}/content`}
        />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <DeleteConfirmationLayout
                titlePrefix='lesson: '
                title={loaderData.name}
                isLoading={isDisabled}
                handleClose={handleClose}
              />
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
