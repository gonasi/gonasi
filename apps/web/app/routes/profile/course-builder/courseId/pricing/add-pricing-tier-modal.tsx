import { memo } from 'react';
import { Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { setCourseFree, setCoursePaid } from '@gonasi/database/courses';
import {
  UpdateCoursePricingTypeSchema,
  type UpdateCoursePricingTypeSchemaTypes,
} from '@gonasi/schemas/coursePricing';

import type { Route } from './+types/add-pricing-tier-modal';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(UpdateCoursePricingTypeSchema);

const Tag = memo(
  ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <span className={`bg-card/50 text-foreground rounded px-1 py-0.5 font-medium ${className}`}>
      {children}
    </span>
  ),
);
Tag.displayName = 'Tag';

export async function action({ params, request }: Route.ActionArgs) {
  // Parse form data and run spam protection
  const formData = await request.formData();
  await checkHoneypot(formData);

  // Initialize Supabase client and validate the form data
  const { supabase } = createClient(request);
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<UpdateCoursePricingTypeSchemaTypes>(formData, resolver);

  // If validation errors exist, return them along with default values
  if (errors) return { errors, defaultValues };

  const redirectTo = `/${params.username}/course-builder/${params.courseId}/pricing`;

  // Define handlers for different pricing types
  const pricingHandlers = {
    free: setCourseFree,
    paid: setCoursePaid,
  };

  const handler = pricingHandlers[data.setToType as keyof typeof pricingHandlers];

  if (!handler) {
    return dataWithError(null, 'Unknown type found');
  }

  const result = await handler({ supabase, courseId: params.courseId });

  return result.success
    ? redirectWithSuccess(redirectTo, result.message)
    : dataWithError(null, result.message);
}

export default function AddPricingTierModal({ params }: Route.ComponentProps) {
  const { username, courseId, actionType } = params;
  const isPending = useIsPending();

  const closeRoute = `/${username}/course-builder/${courseId}/pricing`;

  const methods = useRemixForm<UpdateCoursePricingTypeSchemaTypes>({
    mode: 'all',
    resolver,
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header closeRoute={closeRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <div className='px-1 py-4'>
                <Button
                  className='w-full'
                  type='submit'
                  disabled={isDisabled}
                  isLoading={isDisabled}
                >
                  Add
                </Button>
              </div>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
