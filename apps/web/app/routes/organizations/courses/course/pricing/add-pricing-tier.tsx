import { useEffect, useState } from 'react';
import { Form } from 'react-router';
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
  fetchAvailablePaymentFrequencies,
  fetchCoursePricing,
  type FrequencyOption,
  managePricingTier,
} from '@gonasi/database/courses';
import {
  CoursePricingSchema,
  type CoursePricingSchemaTypes,
  type CurrencyCodeEnumType,
} from '@gonasi/schemas/coursePricing';

import type { Route } from './+types/add-pricing-tier';

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
    { title: 'Add Pricing Tier • Gonasi' },
    {
      name: 'description',
      content:
        'Create a new pricing tier for your course on Gonasi. Set pricing details, access permissions, and enhance your monetization strategy effectively.',
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { courseId, organizationId } = params;

  const redirectToPricingPage = (message: string) =>
    redirectWithError(`/${organizationId}/courses/${courseId}/pricing`, message);

  if (!courseId) {
    return redirectToPricingPage('Invalid course or pricing tier');
  }

  const [pricingData, availableFrequencies] = await Promise.all([
    fetchCoursePricing({ supabase, courseId }),
    fetchAvailablePaymentFrequencies({ supabase, courseId }),
  ]);

  const isPaid = Array.isArray(pricingData)
    ? pricingData.some((item) => item.is_free === false)
    : false;

  const normalizedFrequencies = availableFrequencies ?? [];

  return { isPaid, availableFrequencies: normalizedFrequencies };
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<CoursePricingSchemaTypes>(formData, resolver);

  if (errors) {
    return { errors, defaultValues };
  }

  const { supabase, headers } = createClient(request);

  const result = await managePricingTier({
    supabase,
    data,
  });

  return result.success
    ? redirectWithSuccess(
        `/${params.organizationId}/courses/${params.courseId}/pricing`,
        result.message,
        { headers },
      )
    : dataWithError(null, result.message);
}

// Step generator (removes promotional-pricing if isPaid is false)
const getSteps = (isPaid: boolean) =>
  [
    {
      id: 'basic-config',
      title: 'Basic Configuration',
      path: 'basic-config',
    },
    ...(isPaid
      ? [
          {
            id: 'promotional-pricing',
            title: 'Promotional Pricing',
            path: 'promotional-pricing',
          },
        ]
      : []),
    {
      id: 'display-and-marketing',
      title: 'Display & Marketing',
      path: 'display-and-marketing',
    },
  ] as const;

export default function AddPricingTier({ params, loaderData }: Route.ComponentProps) {
  const { organizationId, courseId } = params;
  const { isPaid, availableFrequencies } = loaderData;

  const steps = getSteps(isPaid);

  type StepId = (typeof steps)[number]['id'];

  const [currentStep, setCurrentStep] = useState<StepId>('basic-config');

  const isPending = useIsPending();

  const methods = useRemixForm<CoursePricingSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      pricingId: 'add-new-tier',
      organizationId: params.organizationId,
      courseId: courseId ?? '',
      isFree: !isPaid,
      currencyCode: 'KES' as CurrencyCodeEnumType,
      isActive: true,
    },
  });

  const frequencyOptions: FrequencyOption[] = availableFrequencies ?? [];

  const { watch, trigger, setValue } = methods;
  const watchedValues = watch();

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const goToNextStep = async () => {
    const isValid = await validateCurrentStep();
    const nextStep = steps[currentStepIndex + 1];
    if (isValid && !isLastStep && nextStep) {
      setCurrentStep(nextStep.id);
    }
  };

  const goToPreviousStep = () => {
    if (!isFirstStep) {
      const prevStep = steps[currentStepIndex - 1];
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

  useEffect(() => {
    if (watchedValues.currencyCode) {
      trigger(['price', 'promotionalPrice']);
    }
  }, [trigger, watchedValues.currencyCode]);

  useEffect(() => {
    if (!watchedValues.enablePromotionalPricing) {
      setValue('promotionalPrice', null);
      setValue('promotionStartDate', undefined);
      setValue('promotionEndDate', undefined);
    }
  }, [watchedValues.enablePromotionalPricing, setValue]);

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

  const closeRoute = `/${organizationId}/courses/${courseId}/pricing`;

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic-config':
        return (
          <div>
            <GoSelectInputField
              labelProps={{ children: 'Access Renewal Frequency', required: true }}
              name='paymentFrequency'
              description={
                isPaid
                  ? 'Choose how often users are billed to continue accessing this tier 💳'
                  : 'Specify how often users must re-enroll to keep accessing this free tier 🔄'
              }
              selectProps={{
                placeholder: 'Select a renewal frequency',
                options: frequencyOptions,
              }}
            />

            {isPaid && (
              <div className='flex items-start justify-start space-x-4'>
                <GoSelectInputField
                  className='max-w-30'
                  labelProps={{ children: 'Currency', required: true }}
                  name='currencyCode'
                  selectProps={{
                    placeholder: 'Currency',
                    options: [
                      { label: 'KES', value: 'KES' },
                      { label: 'USD', value: 'USD' },
                    ],
                    disabled: isDisabled,
                  }}
                />
                <GoInputField
                  className='flex-1'
                  name='price'
                  inputProps={{ type: 'number', disabled: isDisabled }}
                  labelProps={{ children: 'Price', required: true }}
                />
              </div>
            )}
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
              labelProps={{
                children: isPaid ? 'Tier Name' : 'Access Level Name',
              }}
              description={
                isPaid
                  ? 'What should we call this pricing tier?'
                  : 'What should we call this access level?'
              }
            />

            <GoTextAreaField
              labelProps={{
                children: isPaid ? 'Tier Description' : 'Access Level Description',
              }}
              name='tierDescription'
              textareaProps={{ placeholder: 'Give us the details' }}
              description={
                isPaid
                  ? 'Tell us a bit more about what this tier offers'
                  : 'Tell us what users get at this free access level'
              }
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
                  description="Let users know this one's a fan favorite"
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
                {isPaid ? (
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
                ) : null}
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
          title={isPaid ? 'Add New Pricing Tier' : 'Add New Free Access Tier'}
          closeRoute={closeRoute}
        />

        <Modal.Body>
          {!availableFrequencies || !availableFrequencies.length ? (
            <BannerCard
              variant='error'
              message='All pricing options are in use'
              description='Please delete or update a tier, as all available frequencies have already been used.'
              showCloseIcon={false}
            />
          ) : (
            <div className='py-4'>
              <div className='pb-6'>
                {steps.length > 0 && <Stepper steps={steps} currentStepIndex={currentStepIndex} />}
              </div>

              <RemixFormProvider {...methods}>
                <Form method='POST' onSubmit={methods.handleSubmit}>
                  <HoneypotInputs />
                  <div className='rounded-lg'>{renderStepContent()}</div>
                  <div className='flex w-full justify-end'>
                    {isLastStep ? (
                      <Button
                        type='submit'
                        className='flex items-center'
                        rightIcon={<Check />}
                        disabled={isDisabled || !methods.formState.isDirty}
                        isLoading={isDisabled}
                      >
                        {isPaid ? 'Create Pricing Tier' : 'Create Access Tier'}
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

                {!isLastStep && (
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
            </div>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
