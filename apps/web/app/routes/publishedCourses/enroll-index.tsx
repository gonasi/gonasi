import { Form, Outlet, redirect, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { GraduationCap } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { initializeTransactionEnroll } from '@gonasi/database/publishedCourses';
import {
  InitializeEnrollTransactionSchema,
  type InitializeEnrollTransactionSchemaTypes,
} from '@gonasi/schemas/payments';

import type { Route } from './+types/enroll-index';
import type { CoursePricingDataType } from '../public/published-course-id-index';

import { PricingOptionCard } from '~/components/cards/go-course-card/PricingOptionCard';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

interface CoursePricingContextType {
  name: string;
  pricingData: CoursePricingDataType[];
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
  } = await initializeTransactionEnroll(supabase, {
    ...data,
  });

  return success
    ? redirect(`${successData?.data.authorization_url}`)
    : dataWithError(null, message);
}

export default function EnrollIndex({ params }: Route.ComponentProps) {
  const { name, pricingData } = useOutletContext<CoursePricingContextType>();
  const courseId = params.publishedCourseId;
  const isPending = useIsPending();
  const filteredPricingData = pricingData.find((item) => item.id === params.pricingTierId);

  const methods = useRemixForm<InitializeEnrollTransactionSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      courseId,
      pricingTierId: filteredPricingData?.id ?? '',
    },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  if (!filteredPricingData) {
    return (
      <Modal open>
        <Modal.Content size='md'>
          <Modal.Header title='Pricing Tier Not Found' />
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
          <Modal.Header title={`Enroll to ${name}`} closeRoute={`/c/${courseId}`} />
          <Modal.Body className='px-0 md:px-4'>
            <PricingOptionCard pricingData={filteredPricingData} hideContinueButton />
            <RemixFormProvider {...methods}>
              <Form method='POST' onSubmit={methods.handleSubmit}>
                {/* Bot protection */}
                <HoneypotInputs />

                <div className='pt-6 pb-2'>
                  <Button leftIcon={<GraduationCap />} disabled={isDisabled} isLoading={isDisabled}>
                    Enroll
                  </Button>
                </div>
              </Form>
            </RemixFormProvider>
          </Modal.Body>
        </Modal.Content>
      </Modal>
      <Outlet />
    </>
  );
}
