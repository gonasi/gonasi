import { useEffect, useRef } from 'react';
import { Form, useFetcher } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Landmark, LoaderCircle } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { createNewCourseTitle } from '@gonasi/database/courses';
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
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

// SEO metadata
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

const resolver = zodResolver(UpsertPayoutDetailsSchema);

// 🟡 Server Action
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<UpsertPayoutDetailsSchemaTypes>(formData, resolver);

  if (errors) return { errors, defaultValues };

  const result = await createNewCourseTitle(supabase, data);

  if (!result.success || !result.data) {
    return dataWithError(null, result.message);
  }

  return redirectWithSuccess(
    `/${params.username}/course-builder/${result.data.id}/overview`,
    result.message,
  );
}

// 🟢 Main Component
export default function AddPayoutDetails({ params }: Route.ComponentProps) {
  const loaderBanksFetcher = useFetcher<typeof loader>();
  const isSubmitting = useIsPending();

  const methods = useRemixForm<UpsertPayoutDetailsSchemaTypes>({
    mode: 'all',
    resolver,
  });

  const watchCurrency = methods.watch('currency');
  const watchType = methods.watch('type');

  // Prevent infinite renders when fetcher is unstable
  const hasLoadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!watchCurrency || !watchType) return;

    const key = `${params.username}-${watchType}-${watchCurrency}`;

    if (hasLoadedRef.current === key) return;

    loaderBanksFetcher.load(
      `/${params.username}/settings/payout-settings/loader-banks/${watchType}/${watchCurrency}`,
    );

    hasLoadedRef.current = key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.username, watchCurrency, watchType]);

  useEffect(() => {
    if (watchCurrency === 'USD' && methods.getValues('type') !== 'kepss') {
      methods.setValue('type', 'kepss');
      methods.trigger('type');
    }
  }, [watchCurrency, methods]);

  const payoutTypeDescription =
    watchCurrency === 'USD'
      ? 'For USD, we currently support bank transfers only.'
      : 'Select how you’d like to receive your payouts — via bank transfer or mobile money.';

  const bankOptions = (loaderBanksFetcher.data ?? []).map((bank) => ({
    label: bank.label,
    value: String(bank.value),
  }));

  const isDisabled = false;

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title='Payout Details'
          closeRoute={`/${params.username}/settings/payout-settings`}
        />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

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
                disabled={watchCurrency === 'USD' || isDisabled}
                description={payoutTypeDescription}
              />

              <loaderBanksFetcher.Form
                method='get'
                action={`/${params.username}/settings/payout-settings/loader-banks`}
              >
                <GoSearchableDropDown
                  name='bankCode'
                  labelProps={{
                    children: watchType === 'mobile_money' ? 'Mobile Provider' : 'Bank Name',
                    required: true,
                    endAdornment:
                      loaderBanksFetcher.state === 'idle' ? null : (
                        <LoaderCircle size={14} className='animate-spin' />
                      ),
                  }}
                  disabled={isDisabled || loaderBanksFetcher.state !== 'idle'}
                  searchDropdownProps={{
                    options: bankOptions,
                    selectPlaceholder:
                      loaderBanksFetcher.state !== 'idle'
                        ? 'Loading...'
                        : watchType === 'mobile_money'
                          ? 'Select a mobile provider'
                          : 'Select a bank',
                  }}
                  description='We’ll show available banks or mobile providers based on your selected payout method and currency.'
                />
              </loaderBanksFetcher.Form>

              <GoInputField
                name='accountNumber'
                labelProps={{ children: 'Account or Mobile Number', required: true }}
                prefix={watchType === 'mobile_money' ? '+254' : undefined}
                description='Enter your bank account or mobile number where payouts will be sent.'
              />

              <Button
                type='submit'
                disabled={isDisabled}
                isLoading={isDisabled}
                leftIcon={<Landmark />}
              >
                Save Payout Details
              </Button>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
