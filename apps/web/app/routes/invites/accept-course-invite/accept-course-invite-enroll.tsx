import { Form, Outlet, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { GraduationCap } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { initializeInviteEnrollment } from '@gonasi/database/publishedCourses';
import {
  InitializeEnrollTransactionSchema,
  type InitializeEnrollTransactionSchemaTypes,
} from '@gonasi/schemas/payments';
import type { PricingSchemaTypes } from '@gonasi/schemas/publish/course-pricing';

import type { Route } from './+types/accept-course-invite-enroll';

import { PricingOptionCard } from '~/components/cards/go-course-card/PricingOptionCard';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export interface CourseInviteEnrollContextType {
  courseName: string;
  publishedCourseId: string;
  pricingData: PricingSchemaTypes;
  inviteToken: string;
}

const resolver = zodResolver(InitializeEnrollTransactionSchema);

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  // Initialize Supabase (use admin for invite validation)
  const { supabase, supabaseAdmin } = createClient(request);

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
  } = await initializeInviteEnrollment({
    supabase,
    supabaseAdmin,
    data,
    inviteToken: params.token,
  });

  return success
    ? redirectWithSuccess(
        successData
          ? `${successData?.data.authorization_url}`
          : `/i/course-invites/${params.token}/accept`,
        message,
      )
    : dataWithError(null, message);
}

export default function AcceptCourseInviteEnroll({ params }: Route.ComponentProps) {
  const { courseName, publishedCourseId, pricingData, inviteToken } =
    useOutletContext<CourseInviteEnrollContextType>();
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
          <Modal.Header
            title='Pricing Tier Not Found'
            closeRoute={`/i/course-invites/${inviteToken}/accept`}
          />
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
          <Modal.Header
            title={`Enroll to ${courseName}`}
            closeRoute={`/i/course-invites/${inviteToken}/accept`}
          />
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
                    Enroll via Invitation
                  </Button>
                </div>
              </Form>
            </RemixFormProvider>
          </Modal.Body>
        </Modal.Content>
      </Modal>
      <Outlet context={{ courseName, publishedCourseId, pricingData, inviteToken }} />
    </>
  );
}
