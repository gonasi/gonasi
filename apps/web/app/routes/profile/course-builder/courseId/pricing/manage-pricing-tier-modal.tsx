import { useEffect, useState } from 'react';
import { Form, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { redirectWithError } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { fetchCoursePricingTierById } from '@gonasi/database/courses';
import { CoursePricingSchema, type CoursePricingSchemaTypes } from '@gonasi/schemas/coursePricing';

import type { Route } from './+types/manage-pricing-tier-modal';
import type { AvailableFrequenciesLoaderReturnType } from './pricing-index';

import { BannerCard } from '~/components/cards';
import { Button } from '~/components/ui/button';
import { GoInputField, GoSelectInputField, GoSwitchField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { Stepper } from '~/components/ui/stepper';
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
  return true;
}

const STEPS = [
  {
    id: 'basic-config',
    title: 'Basic Configuration',

    path: 'basic-config',
  },
  {
    id: 'promotional-pricing',
    title: 'Promotional Pricing',

    path: 'promotional-pricing',
  },
  {
    id: 'display-and-marketing',
    title: 'Display & Marketing',

    path: 'display-and-marketing',
  },
] as const;

type StepId = (typeof STEPS)[number]['id'];

export default function ManagePricingTierModal({ params, loaderData }: Route.ComponentProps) {
  const { username, courseId, coursePricingId } = params;

  const { isPaid, availableFrequencies } =
    useOutletContext<{
      isPaid: boolean;
      availableFrequencies: AvailableFrequenciesLoaderReturnType;
    }>() ?? {};

  const isPending = useIsPending();

  const closeRoute = `/${username}/course-builder/${courseId}/pricing`;

  const [currentStep, setCurrentStep] = useState<StepId>('basic-config');

  const methods = useRemixForm<CoursePricingSchemaTypes>({
    mode: 'all',
    resolver,
  });

  const { watch, trigger } = methods;
  const watchedValues = watch();

  // Step navigation
  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const goToNextStep = async () => {
    const isValid = await validateCurrentStep();
    const nextStep = STEPS[currentStepIndex + 1];

    if (isValid && !isLastStep && nextStep) {
      setCurrentStep(nextStep.id);
    }
  };

  const goToPreviousStep = () => {
    if (!isFirstStep) {
      const prevStep = STEPS[currentStepIndex - 1];
      if (prevStep) {
        setCurrentStep(prevStep.id);
      }
    }
  };

  const goToStep = (stepId: StepId) => {
    setCurrentStep(stepId);
  };

  const validateCurrentStep = async () => {
    switch (currentStep) {
      case 'basic-config':
        return await trigger(['paymentFrequency', 'price', 'currencyCode']);
      case 'promotional-pricing':
        return await trigger([
          'enablePromotionalPricing',
          'promotionalPrice',
          'promotionStartDate',
          'promotionEndDate',
        ]);
      case 'display-and-marketing':
        return await trigger([
          'tierName',
          'tierDescription',
          'isActive',
          'isPopular',
          'isRecommended',
        ]);
      default:
        return true;
    }
  };

  // Check if step is completed
  const isStepCompleted = (stepId: StepId) => {
    switch (stepId) {
      case 'basic-config': {
        return (
          !!watchedValues.paymentFrequency && !!watchedValues.price && !!watchedValues.currencyCode
        );
      }

      case 'promotional-pricing': {
        const promoEnabled: boolean = watchedValues.enablePromotionalPricing;
        return promoEnabled
          ? !!watchedValues.promotionalPrice &&
              !!watchedValues.promotionStartDate &&
              !!watchedValues.promotionEndDate
          : true;
      }

      case 'display-and-marketing': {
        return (
          !!watchedValues.tierName &&
          !!watchedValues.tierDescription &&
          watchedValues.isActive !== undefined &&
          watchedValues.isPopular !== undefined &&
          watchedValues.isRecommended !== undefined
        );
      }

      default:
        return false;
    }
  };

  const isDisabled = isPending || methods.formState.isSubmitting;

  //
  useEffect(() => {
    if (watchedValues.currencyCode) {
      trigger(['price', 'promotionalPrice']);
    }
  }, [trigger, watchedValues.currencyCode]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic-config':
        return (
          <div>
            <GoSelectInputField
              labelProps={{ children: 'Payment Frequency', required: true }}
              name='paymentFrequency'
              description='How often user subscribes and repays the course 📚'
              selectProps={{
                placeholder: 'Select a payment frequency',
                options:
                  availableFrequencies && availableFrequencies.length ? availableFrequencies : [],
                disabled: isDisabled,
              }}
            />
            <div>
              <div className='flex items-start justify-start space-x-4'>
                <GoSelectInputField
                  className='max-w-30'
                  labelProps={{ children: 'Currency', required: true }}
                  name='currencyCode'
                  selectProps={{
                    placeholder: 'Currency',
                    options: [
                      {
                        label: 'KES',
                        value: 'KES',
                      },
                      {
                        label: 'USD',
                        value: 'USD',
                      },
                    ],

                    disabled: isDisabled,
                  }}
                />
                <GoInputField
                  className='flex-1'
                  name='price'
                  inputProps={{
                    type: 'number',
                    disabled: isDisabled,
                    autoFocus: false,
                  }}
                  labelProps={{ children: 'Pirce', required: true }}
                />
              </div>
            </div>
          </div>
        );

      case 'promotional-pricing':
        return (
          <div>
            <GoSwitchField
              name='enablePromotionalPricing'
              labelProps={{ children: 'Enable promotional price', required: true }}
              description='Set up promotions for this tier'
            />

            <AnimatePresence>
              {watchedValues.enablePromotionalPricing && (
                <motion.div
                  key='promotionalPriceField'
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <GoInputField
                    className='flex-1'
                    name='promotionalPrice'
                    inputProps={{
                      type: 'number',
                      disabled: isDisabled,
                      autoFocus: false,
                      leftIcon: <div className='mt-1 text-xs'>{watchedValues.currencyCode}</div>,
                    }}
                    labelProps={{ children: 'Promotional price', required: true }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'display-and-marketing':
        return (
          <GoInputField
            name='name'
            labelProps={{ children: 'Tier Name', required: true }}
            description='Give this pricing tier a descriptive name'
          />
        );

      default:
        return null;
    }
  };

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
            <div className='py-4'>
              <div className='pb-6'>
                {/* Step indicator */}
                {STEPS.length > 0 && (
                  <Stepper steps={[...STEPS]} currentStepIndex={currentStepIndex} />
                )}
              </div>

              <RemixFormProvider {...methods}>
                <Form method='POST' onSubmit={methods.handleSubmit}>
                  <HoneypotInputs />
                  <div className='rounded-lg'>{renderStepContent()}</div>
                  {/* Navigation buttons */}
                  <div className='flex justify-between'>
                    <Button
                      type='button'
                      variant='ghost'
                      onClick={goToPreviousStep}
                      disabled={isFirstStep}
                      leftIcon={<ChevronLeft />}
                    >
                      Previous
                    </Button>

                    {isLastStep ? (
                      <Button type='submit' className='flex items-center'>
                        Complete Setup
                        <Check />
                      </Button>
                    ) : (
                      <Button
                        type='button'
                        variant='ghost'
                        onClick={goToNextStep}
                        rightIcon={<ChevronRight />}
                      >
                        Next
                      </Button>
                    )}
                  </div>
                </Form>
              </RemixFormProvider>
            </div>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
