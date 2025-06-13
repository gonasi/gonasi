import { Form, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { deleteUserLessonById } from '@gonasi/database/lessons';
import {
  DeleteCoursePricingTierSchema,
  type DeleteCoursePricingTierSchemaTypes,
} from '@gonasi/schemas/coursePricing';

import type { Route } from './+types/delete-pricing-tier-modal';

import { DeleteConfirmationLayout } from '~/components/layouts/modals';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(DeleteCoursePricingTierSchema);

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<DeleteCoursePricingTierSchemaTypes>(formData, resolver);

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

export default function DeletePricingTier({ params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const handleClose = () =>
    navigate(`/${params.username}/course-builder/${params.courseId}/content`);

  const isPending = useIsPending();

  const methods = useRemixForm<DeleteCoursePricingTierSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      coursePricingTierId: params.coursePricingId,
    },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          closeRoute={`/${params.username}/course-builder/${params.courseId}/pricing`}
        />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <DeleteConfirmationLayout
                titlePrefix='this'
                title='Pricing Tier'
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
