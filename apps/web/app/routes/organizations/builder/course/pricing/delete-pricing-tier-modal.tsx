import { Form, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { deleteCoursePricingTier } from '@gonasi/database/courses/pricing';
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

  // Anti-bot check using honeypot
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  // Validate form data against schema
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<DeleteCoursePricingTierSchemaTypes>(formData, resolver);

  if (errors) return { errors, defaultValues };

  // Attempt to delete the pricing tier
  const { success, message } = await deleteCoursePricingTier(supabase, data);

  if (!success) {
    return dataWithError(null, message);
  }

  // Redirect on success
  const redirectPath = `/${params.organizationId}/builder/${params.courseId}/pricing`;
  return redirectWithSuccess(redirectPath, message);
}

export default function DeletePricingTier({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const isPending = useIsPending();

  const redirectPath = `/${params.organizationId}/builder/${params.courseId}/pricing`;

  // Form setup with Remix Hook Form and Zod schema
  const methods = useRemixForm<DeleteCoursePricingTierSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      coursePricingTierId: params.coursePricingId,
    },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  const handleClose = () => navigate(redirectPath);

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header closeRoute={redirectPath} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              {/* Honeypot field for spam protection */}
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
