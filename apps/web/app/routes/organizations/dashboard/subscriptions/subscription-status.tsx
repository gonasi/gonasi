import { CheckCircle, XCircle } from 'lucide-react';
import { dataWithError } from 'remix-toast';

import type { Route } from './+types/subscription-status';

import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [
    { title: 'Subscription Payment Verification • Gonasi' },
    {
      name: 'description',
      content:
        'Verify your organization’s subscription payment and manage billing status on Gonasi.',
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const reference = url.searchParams.get('reference');
  const { supabase } = createClient(request);

  if (!reference) {
    return dataWithError(
      null,
      'Missing transaction reference. If you have already completed a payment, please contact support.',
    );
  }

  // Verify payment via Edge Function
  const { data, error } = await supabase.functions.invoke('verify-paystack-transaction', {
    body: { reference },
  });

  if (error) {
    console.error('[Edge Function Error]', error);
    return dataWithError(
      null,
      'We encountered a problem verifying your payment. Please refresh this page or contact support for assistance.',
    );
  }

  if (!data) {
    return dataWithError(
      null,
      'No verification data was returned. Please try again or reach out to support if this persists.',
    );
  }

  return {
    reference,
    transaction: data?.transaction,
    status: data?.status,
  };
}

export default function SubscriptionStatus({ params, loaderData }: Route.ComponentProps) {
  if (!loaderData) {
    return (
      <Modal open>
        <Modal.Content size='sm'>
          <Modal.Header
            title='Subscription Verification'
            closeRoute={`/${params.organizationId}/dashboard/subscriptions`}
          />
          <Modal.Body className='space-y-4 px-4 py-4'>
            <div className='flex items-center space-x-2'>
              <XCircle className='text-danger h-6 w-6' />
              <h2 className='text-lg font-semibold'>Verification Failed</h2>
            </div>
            <p className='text-muted-foreground text-sm'>
              We couldn’t verify your subscription at this time. Please refresh this page or contact
              our support team for help.
            </p>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    );
  }

  const { reference, transaction } = loaderData;
  const isSuccessful = transaction?.status === 'success';

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='Subscription Payment Verification'
          closeRoute={`/${params.organizationId}/dashboard/subscriptions`}
        />
        <Modal.Body className='space-y-4 px-4 py-4'>
          <div className='flex items-center space-x-2'>
            {isSuccessful ? (
              <CheckCircle className='text-success h-6 w-6' />
            ) : (
              <XCircle className='text-danger h-6 w-6' />
            )}
            <h2 className='text-lg font-semibold'>
              {isSuccessful ? 'Payment Confirmed 🎉' : 'Verification Failed'}
            </h2>
          </div>

          <div className='text-muted-foreground space-y-2 pb-4 text-sm'>
            {isSuccessful ? (
              <>
                <p>Your payment has been successfully verified.</p>
                <p>Your organization’s subscription is now active — thank you for upgrading!</p>
              </>
            ) : (
              <>
                <p>
                  We couldn’t verify your payment. This might be caused by a temporary network delay
                  or an incomplete transaction.
                </p>
                <p>
                  If funds were deducted, don’t worry — it’s usually resolved automatically within a
                  few minutes. Please refresh this page later or contact support for assistance.
                </p>
              </>
            )}
          </div>

          <div className='text-muted-foreground border-t pt-2 text-xs'>
            <p>
              <span className='font-medium'>Reference:</span> <code>{reference}</code>
            </p>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
