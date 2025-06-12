import { Form, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { fetchCoursePricingTierById, setCourseFree, setCoursePaid } from '@gonasi/database/courses';
import {
  CoursePricingSchema,
  type CoursePricingSchemaTypes,
  type UpdateCoursePricingTypeSchemaTypes,
} from '@gonasi/schemas/coursePricing';

import type { Route } from './+types/manage-pricing-tier-modal';
import type { AvailableFrequenciesLoaderReturnType } from './pricing-index';

import { BannerCard } from '~/components/cards';
import { Button } from '~/components/ui/button';
import { GoInputField, GoSelectInputField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(CoursePricingSchema);

export function meta() {
  return [
    { title: 'Manage Pricing Tier | Gonasi' },
    {
      name: 'description',
      content:
        'Configure and manage pricing tiers for your course on Gonasi. Set pricing details, access permissions, and enhance your monetization strategy effectively.',
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { coursePricingId, courseId, username } = params;

  const redirectToPricingPage = (message: string) =>
    redirectWithError(`/${username}/course-builder/${courseId}/pricing`, message);

  const pricingTier = await fetchCoursePricingTierById({ supabase, coursePricingId });

  if (!pricingTier && coursePricingId !== 'add-new-tier') {
    return redirectToPricingPage('Pricing tier does not exist or you lack permissions');
  }

  return { pricingTier };
}

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

export default function AddPricingTierModal({ params, loaderData }: Route.ComponentProps) {
  console.log('******* loader data is: ', loaderData);
  const { username, courseId, coursePricingId } = params;

  const { isPaid, availableFrequencies } =
    useOutletContext<{
      isPaid: boolean;
      availableFrequencies: AvailableFrequenciesLoaderReturnType;
    }>() ?? {};

  const isPending = useIsPending();

  const closeRoute = `/${username}/course-builder/${courseId}/pricing`;

  const methods = useRemixForm<CoursePricingSchemaTypes>({
    mode: 'all',
    resolver,
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title={coursePricingId === 'add-new-tier' ? 'Add New Pricing Tier' : 'Edit Pricing Tier'}
          closeRoute={closeRoute}
        />
        <Modal.Body>
          {!isPaid ? (
            <BannerCard
              variant='error'
              message='Pricing tiers are only available for paid courses'
              description='To enable tiered pricing, switch this course to paid.'
              showCloseIcon={false}
            />
          ) : !availableFrequencies || !availableFrequencies.length ? (
            <BannerCard
              variant='error'
              message='All pricing options are in use'
              description='Please delete or update a tier, as all available frequencies—monthly, bi-monthly, quarterly, semi-annual, and annual—have already been used.'
              showCloseIcon={false}
            />
          ) : (
            <RemixFormProvider {...methods}>
              <Form method='POST' onSubmit={methods.handleSubmit}>
                <HoneypotInputs />

                <GoSelectInputField
                  labelProps={{ children: 'How did this feel?', required: true }}
                  name='experience'
                  description='Give us the vibe check! 📚'
                  selectProps={{
                    placeholder: 'Select a payment frequency',
                    options: availableFrequencies,
                  }}
                />
                <GoInputField
                  name='name'
                  labelProps={{ children: 'How did this feel?', required: true }}
                />

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
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
