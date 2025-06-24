import { useEffect, useRef, useState } from 'react';
import { Form, useFetcher } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { upsertPaystackSubaccount } from '@gonasi/database/settings';
import {
  PAYOUT_TYPE,
  SUPPORTED_CURRENCIES,
  UpsertPayoutDetailsSchema,
  type UpsertPayoutDetailsSchemaTypes,
} from '@gonasi/schemas/settings';

import type { Route } from './+types/add-payout-details';
import type { loader } from './loader-banks';

import { Button } from '~/components/ui/button';
import {
  GoInputField,
  GoSearchableDropDown,
  GoSelectInputField,
} from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { Stepper } from '~/components/ui/stepper';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

// Constants
const resolver = zodResolver(UpsertPayoutDetailsSchema);

const STEPS = [
  {
    id: 'payout-preferences',
    title: 'Payout Preferences',
    path: 'payout-preferences',
  },
  {
    id: 'bank-details',
    title: 'Bank Details',
    path: 'bank-details',
  },
] as const;

type StepId = (typeof STEPS)[number]['id'];

// Meta function
export function meta() {
  return [
    { title: 'Set Up How You Get Paid | Gonasi' },
    {
      name: 'description',
      content:
        'Get paid seamlessly. Add your payout details so we can transfer your earnings securely and on time.',
    },
  ];
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<UpsertPayoutDetailsSchemaTypes>(formData, resolver);

  if (errors) {
    return { errors, defaultValues };
  }

  const { supabase } = createClient(request);

  const result = await upsertPaystackSubaccount({
    supabase,
    data,
  });

  return result.success
    ? redirectWithSuccess(`/${params.username}/settings/payout-settings`, result.message)
    : dataWithError(null, result.message);
}

// Main component
export default function AddPayoutDetails({ params }: Route.ComponentProps) {
  // Hooks
  const loaderBanksFetcher = useFetcher<typeof loader>();
  const isPending = useIsPending();
  const [currentStep, setCurrentStep] = useState<StepId>('payout-preferences');

  const methods = useRemixForm<UpsertPayoutDetailsSchemaTypes>({
    mode: 'all',
    resolver,
  });

  const { watch, trigger, setValue, clearErrors, resetField } = methods;
  const watchedValues = watch();

  // Computed values
  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const isDisabled = isPending || methods.formState.isSubmitting;

  const bankOptions = (loaderBanksFetcher.data ?? []).map((bank) => ({
    label: bank.label,
    value: String(bank.value),
  }));

  const payoutTypeDescription =
    watchedValues.currency === 'USD'
      ? 'For USD, we currently support bank transfers only.'
      : `Select how you'd like to receive your payouts — via bank transfer or mobile money.`;

  const loadRef = useRef(loaderBanksFetcher.load);
  loadRef.current = loaderBanksFetcher.load;

  useEffect(() => {
    if (currentStep === 'bank-details' && watchedValues.type && watchedValues.currency) {
      resetField('bankCode');

      const bankLoaderUrl = `/${params.username}/settings/payout-settings/loader-banks/${watchedValues.type}/${watchedValues.currency}`;
      loadRef.current(bankLoaderUrl);
    }
  }, [currentStep, params.username, watchedValues.type, watchedValues.currency, resetField]);

  useEffect(() => {
    if (watchedValues.currency === 'USD') {
      setValue('type', 'kepss');
    }
  }, [setValue, watchedValues.currency]);

  // Step validation
  const validateCurrentStep = async (): Promise<boolean> => {
    switch (currentStep) {
      case 'payout-preferences':
        clearErrors(['bankCode', 'accountNumber']);
        return await trigger(['currency', 'type']);
      case 'bank-details':
        return await trigger(['bankCode', 'accountNumber']);
      default:
        return true;
    }
  };

  // Navigation handlers
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

  // Step content renderers
  const renderPayoutPreferencesStep = () => (
    <div>
      <GoSelectInputField
        name='currency'
        labelProps={{ children: 'Preferred Currency', required: true }}
        selectProps={{
          options: SUPPORTED_CURRENCIES,
          placeholder: 'Choose a currency',
          imageContainerClassName: 'rounded-none',
          imageClassName: 'h-6 w-6 object-contain rounded-none',
        }}
        disabled={isDisabled}
        description='Select the currency you wish to receive your payouts in. Make sure your selected payout method supports this currency.'
      />
      <GoSelectInputField
        name='type'
        labelProps={{ children: 'Payout Method', required: true }}
        selectProps={{
          options: PAYOUT_TYPE,
          placeholder: 'Choose how to get paid',
        }}
        disabled={watchedValues.currency === 'USD' || isDisabled}
        description={payoutTypeDescription}
      />
    </div>
  );

  const renderBankDetailsStep = () => {
    const isBankDataLoading = loaderBanksFetcher.state !== 'idle';
    const isMobileMoney = watchedValues.type === 'mobile_money';

    return (
      <div>
        <GoSearchableDropDown
          name='bankCode'
          labelProps={{
            children: isMobileMoney ? 'Mobile Provider' : 'Bank Name',
            required: true,
            endAdornment: isBankDataLoading ? (
              <LoaderCircle size={14} className='animate-spin' />
            ) : null,
          }}
          disabled={isDisabled || isBankDataLoading}
          searchDropdownProps={{
            options: bankOptions,
            selectPlaceholder: isBankDataLoading
              ? 'Loading...'
              : isMobileMoney
                ? 'Select a mobile provider'
                : 'Select a bank',
          }}
          description="We'll show available banks or mobile providers based on your selected payout method and currency."
        />
        <GoInputField
          name='accountNumber'
          labelProps={{
            children: isMobileMoney ? 'Mobile Number' : 'Account Number',
            required: true,
          }}
          prefix={isMobileMoney ? '+254' : undefined}
          description='Enter your bank account or mobile number where payouts will be sent.'
        />
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'payout-preferences':
        return renderPayoutPreferencesStep();

      case 'bank-details':
        return renderBankDetailsStep();

      default:
        return null;
    }
  };

  // Navigation buttons component
  const renderNavigationButtons = () => (
    <>
      {/* Submit button area */}
      <div className='flex w-full justify-end'>
        {isLastStep ? (
          <Button
            type='submit'
            className='flex items-center'
            rightIcon={<Check />}
            disabled={isDisabled}
            isLoading={isDisabled}
          >
            Create New
          </Button>
        ) : (
          <div className='h-12' />
        )}
      </div>

      {/* Previous/Next buttons */}
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
          <Button type='button' variant='ghost' onClick={goToNextStep} rightIcon={<ChevronRight />}>
            Next
          </Button>
        )}
      </div>
    </>
  );

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title='Payout Details'
          closeRoute={`/${params.username}/settings/payout-settings`}
        />
        <Modal.Body>
          <div className='py-4'>
            {/* Step indicator */}
            <div className='pb-6'>
              <Stepper steps={[...STEPS]} currentStepIndex={currentStepIndex} />
            </div>

            {/* Form content */}
            <RemixFormProvider {...methods}>
              <Form method='POST' onSubmit={methods.handleSubmit}>
                <HoneypotInputs />

                {/* Step content */}
                <div className='mb-6 rounded-lg'>{renderStepContent()}</div>

                {/* Navigation */}
                {renderNavigationButtons()}
              </Form>
            </RemixFormProvider>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
