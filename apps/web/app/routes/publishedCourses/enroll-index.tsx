import { Form, Outlet, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { GraduationCap } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { initializeTransactionEnroll } from '@gonasi/database/publishedCourses';
import {
  InitializeEnrollTransactionSchema,
  type InitializeEnrollTransactionSchemaTypes,
} from '@gonasi/schemas/payments';
import type { PricingSchemaTypes } from '@gonasi/schemas/publish/course-pricing';

import type { Route } from './+types/enroll-index';

import { PricingOptionCard } from '~/components/cards/go-course-card/PricingOptionCard';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export interface CoursePricingContextType {
  name: string;
  pricingData: PricingSchemaTypes;
}

const resolver = zodResolver(InitializeEnrollTransactionSchema);

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  // Initialize Supabase and headers for redirect
  const { supabase } = createClient(request);

  // Validate and parse form data with Zod
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<InitializeEnrollTransactionSchemaTypes>(formData, resolver);

  // Return validation errors, if any
  if (errors) {
    return { errors, defaultValues };
  }

  const {
    success,
    message,
    data: successData,
  } = await initializeTransactionEnroll({
    supabase,
    data,
  });

  return success
    ? redirectWithSuccess(
        successData ? `${successData?.data.authorization_url}` : `/c/${params.publishedCourseId}`,
        message,
      )
    : dataWithError(null, message);
}

export default function EnrollIndex({ params }: Route.ComponentProps) {
  const { name, pricingData } = useOutletContext<CoursePricingContextType>();
  const publishedCourseId = params.publishedCourseId;
  const isPending = useIsPending();
  const filteredPricingData = pricingData.find((item) => item.id === params.pricingTierId);

  const methods = useRemixForm<InitializeEnrollTransactionSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      publishedCourseId,
      pricingTierId: filteredPricingData?.id ?? '',
      organizationId: filteredPricingData?.organization_id ?? '',
    },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  if (!filteredPricingData) {
    return (
      <Modal open>
        <Modal.Content size='md'>
          <Modal.Header title='Pricing Tier Not Found' closeRoute={`/c/${publishedCourseId}`} />
          <Modal.Body>
            <p>No pricing tier matches the given ID.</p>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    );
  }

  return (
    <>
      <Modal open>
        <Modal.Content size='md'>
          <Modal.Header title={`Enroll to ${name}`} closeRoute={`/c/${publishedCourseId}`} />
          <Modal.Body className='px-4'>
            <PricingOptionCard pricingData={filteredPricingData} hideContinueButton />
            <RemixFormProvider {...methods}>
              <Form method='POST' onSubmit={methods.handleSubmit}>
                {/* Bot protection */}
                <HoneypotInputs />

                <div className='pt-6 pb-2'>
                  <Button
                    type='submit'
                    leftIcon={<GraduationCap />}
                    disabled={isDisabled}
                    isLoading={isDisabled}
                  >
                    Enroll
                  </Button>
                </div>
              </Form>
            </RemixFormProvider>
          </Modal.Body>
        </Modal.Content>
      </Modal>
      <Outlet context={{ name, pricingData }} />
    </>
  );
}
