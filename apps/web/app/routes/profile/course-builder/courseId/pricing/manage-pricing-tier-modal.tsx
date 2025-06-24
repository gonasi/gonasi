import { useEffect, useState } from 'react';
import { Form, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkle,
  Star,
  TrendingUp,
} from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import {
  addFrequencyOption,
  fetchCoursePricingTierById,
  type FrequencyOption,
  managePricingTier,
} from '@gonasi/database/courses';
import {
  CoursePricingSchema,
  type CoursePricingSchemaTypes,
  type CurrencyCodeEnumType,
} from '@gonasi/schemas/coursePricing';

import type { Route } from './+types/manage-pricing-tier-modal';
import type { AvailableFrequenciesLoaderReturnType } from './pricing-index';

import { BannerCard } from '~/components/cards';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  GoCalendar26,
  GoInputField,
  GoSelectInputField,
  GoSwitchField,
  GoTextAreaField,
} from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { Stepper } from '~/components/ui/stepper';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';
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

  console.log(pricingTier);

  return { pricingTier };
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<CoursePricingSchemaTypes>(formData, resolver); // ← Pass formData here

  if (errors) {
    return { errors, defaultValues };
  }

  const { supabase } = createClient(request);

  const result = await managePricingTier({
    supabase,
    data,
  });

  return result.success
    ? redirectWithSuccess(
        `/${params.username}/course-builder/${params.courseId}/pricing`,
        result.message,
      )
    : dataWithError(null, result.message);
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

  const { pricingTier } = loaderData;

  const { isPaid, availableFrequencies } =
    useOutletContext<{
      isPaid: boolean;
      availableFrequencies: AvailableFrequenciesLoaderReturnType;
    }>() ?? {};

  const isPending = useIsPending();

  const badgeVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
  };

  const iconVariants = {
    initial: { opacity: 0, rotate: -15, scale: 0.8 },
    animate: { opacity: 1, rotate: 0, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, rotate: 15, scale: 0.8, transition: { duration: 0.15 } },
  };

  const closeRoute = `/${username}/course-builder/${courseId}/pricing`;

  const [currentStep, setCurrentStep] = useState<StepId>('basic-config');

  const methods = useRemixForm<CoursePricingSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      pricingId: params.coursePricingId,
      courseId: courseId ?? '',
      paymentFrequency: pricingTier?.payment_frequency,
      isFree: !isPaid,
      price: pricingTier?.price,
      position: pricingTier?.position,
      currencyCode: pricingTier?.currency_code as CurrencyCodeEnumType,
      enablePromotionalPricing: !!pricingTier?.promotional_price,
      promotionalPrice: pricingTier?.promotional_price,
      promotionStartDate: pricingTier?.promotion_start_date
        ? new Date(pricingTier.promotion_start_date)
        : undefined,
      promotionEndDate: pricingTier?.promotion_end_date
        ? new Date(pricingTier.promotion_end_date)
        : undefined,
      tierName: pricingTier?.tier_name,
      tierDescription: pricingTier?.tier_description,
      isPopular: pricingTier?.is_popular,
      isActive: pricingTier?.is_active,
      isRecommended: pricingTier?.is_recommended,
    },
  });

  const normalizedFrequencies = availableFrequencies ?? [];
  const frequencyOptions: FrequencyOption[] =
    coursePricingId === 'add-new-tier'
      ? normalizedFrequencies
      : addFrequencyOption(pricingTier?.payment_frequency ?? 'monthly', normalizedFrequencies);

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
              description="User's subscription and repayment frequency 📚"
              selectProps={{
                placeholder: 'Select a payment frequency',
                options: frequencyOptions,
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
              description='Allow promotional pricing for this tier'
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
                    description='Enter the discounted price for the promotion.'
                  />
                  <GoCalendar26
                    name='promotionStartDate'
                    labelProps={{ children: 'Promotion start date', required: true }}
                    description='Select the date when the promotional price will begin.'
                  />
                  <GoCalendar26
                    name='promotionEndDate'
                    labelProps={{ children: 'Promotion end date', required: true }}
                    description='Select the date when the promotional price will end.'
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'display-and-marketing':
        return (
          <div>
            <GoInputField
              name='tierName'
              labelProps={{ children: 'Tier name' }}
              description='What should we call this tier?'
            />
            <GoTextAreaField
              labelProps={{ children: 'Tier description' }}
              name='tierDescription'
              textareaProps={{ placeholder: 'Give us the details' }}
              description='Tell us a bit more about what this tier offers'
            />
            <div>
              <div className='flex items-center space-x-1.5 py-4'>
                <Sparkle />
                <h2 className='border-b-border/10 mt-1 border-b text-xl'>Enhancement Badges</h2>
              </div>
              <div className='grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-x-4'>
                <GoSwitchField
                  name='isPopular'
                  labelProps={{
                    children: (
                      <div className='flex items-center space-x-2'>
                        <Star size={16} />
                        <span className='flex items-center gap-1'>
                          Mark as{' '}
                          <AnimatePresence mode='wait' initial={false}>
                            <motion.div
                              key={watchedValues.isPopular ? 'info' : 'outline'}
                              variants={badgeVariants}
                              initial='initial'
                              animate='animate'
                              exit='exit'
                            >
                              <Badge variant={watchedValues.isPopular ? 'info' : 'outline'}>
                                Most Popular
                              </Badge>
                            </motion.div>
                          </AnimatePresence>
                        </span>
                      </div>
                    ),
                  }}
                  description='Let users know this one’s a fan favorite'
                />

                <GoSwitchField
                  name='isRecommended'
                  labelProps={{
                    children: (
                      <div className='flex items-center space-x-2'>
                        <TrendingUp size={16} />
                        <span className='flex items-center gap-1'>
                          Mark as{' '}
                          <AnimatePresence mode='wait' initial={false}>
                            <motion.div
                              key={watchedValues.isRecommended ? 'tip' : 'outline'}
                              variants={badgeVariants}
                              initial='initial'
                              animate='animate'
                              exit='exit'
                            >
                              <Badge variant={watchedValues.isRecommended ? 'tip' : 'outline'}>
                                Recommended
                              </Badge>
                            </motion.div>
                          </AnimatePresence>
                        </span>
                      </div>
                    ),
                  }}
                  description='Highlight this tier as your top pick'
                />
                <GoSwitchField
                  name='isActive'
                  labelProps={{
                    children: (
                      <div className='flex items-center space-x-1'>
                        <span>Active</span>
                        <span
                          className={cn(
                            watchedValues.isActive ? 'text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          (Visible to customers)
                        </span>

                        <AnimatePresence mode='wait' initial={false}>
                          <motion.span
                            key={watchedValues.isActive ? 'eye' : 'eye-off'}
                            variants={iconVariants}
                            initial='initial'
                            animate='animate'
                            exit='exit'
                          >
                            {watchedValues.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    ),
                  }}
                  description='Turn this on to make the tier publicly available'
                />
              </div>
            </div>
          </div>
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
          ) : coursePricingId === 'add-new-tier' &&
            (!availableFrequencies || !availableFrequencies.length) ? (
            <BannerCard
              variant='error'
              message='All pricing options are in use'
              description='Please delete or update a tier, as all available frequencies. Monthly, bi-monthly, quarterly, semi-annual, and annual have already been used.'
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
                  <div className='flex w-full justify-end'>
                    {isLastStep ? (
                      <Button
                        type='submit'
                        className='flex items-center'
                        rightIcon={<Check />}
                        disabled={isDisabled}
                        isLoading={isDisabled}
                      >
                        {params.coursePricingId === 'add-new-tier'
                          ? 'Create Pricing Tier'
                          : 'Edit Pricing Tier'}
                      </Button>
                    ) : (
                      <div className='h-12' />
                    )}
                  </div>
                </Form>
              </RemixFormProvider>
              <div className='-mt-12 flex justify-between'>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={goToPreviousStep}
                  disabled={isFirstStep}
                  leftIcon={<ChevronLeft />}
                >
                  Previous
                </Button>

                {!isLastStep ? (
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={goToNextStep}
                    rightIcon={<ChevronRight />}
                  >
                    Next
                  </Button>
                ) : null}
              </div>
            </div>
          )}
          <div className='mb-20' />
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
