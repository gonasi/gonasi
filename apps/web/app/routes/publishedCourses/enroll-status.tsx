import { useOutletContext } from 'react-router';
import { CheckCircle, XCircle } from 'lucide-react';
import { dataWithError } from 'remix-toast';

import type { Route } from './+types/enroll-status';
import type { CoursePricingContextType } from './enroll-index';

import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const reference = url.searchParams.get('reference');
  const { supabase } = createClient(request);

  if (!reference) {
    return dataWithError(
      null,
      'Missing transaction reference. Please contact support if you already made a payment.',
    );
  }

  // Verify payment through Edge Function
  const { data, error } = await supabase.functions.invoke('verify-paystack-transaction', {
    body: { reference },
  });

  if (error) {
    console.error('[Edge Function Error]', error);
    return dataWithError(
      null,
      'We encountered a verification issue. Please refresh the page or contact support for assistance.',
    );
  }

  if (!data) {
    return dataWithError(
      null,
      'No verification data returned. Please try again or contact support if this continues.',
    );
  }

  return {
    reference,
    transaction: data?.transaction,
    status: data?.status,
  };
}

export default function EnrollStatus({ params, loaderData }: Route.ComponentProps) {
  const { name } = useOutletContext<CoursePricingContextType>();
  const publishedCourseId = params.publishedCourseId;

  // Handle missing loaderData early
  if (!loaderData) {
    return (
      <Modal open>
        <Modal.Content size='sm'>
          <Modal.Header title='Enrollment Status' closeRoute={`/c/${publishedCourseId}`} />
          <Modal.Body className='space-y-4 px-4 py-4'>
            <div className='flex items-center space-x-2'>
              <XCircle className='text-danger h-6 w-6' />
              <h2 className='text-lg font-semibold'>Verification Failed</h2>
            </div>
            <p className='text-muted-foreground text-sm'>
              We couldn’t verify your enrollment. Please refresh this page or contact support.
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
        <Modal.Header title={`Enrollment — ${name}`} closeRoute={`/c/${publishedCourseId}`} />
        <Modal.Body className='space-y-4 px-4 py-4'>
          <div className='flex items-center space-x-2'>
            {isSuccessful ? (
              <CheckCircle className='text-success h-6 w-6' />
            ) : (
              <XCircle className='text-danger h-6 w-6' />
            )}
            <h2 className='text-lg font-semibold'>
              {isSuccessful ? 'Enrollment Successful 🎉' : 'Payment Verification Failed'}
            </h2>
          </div>

          <div className='text-muted-foreground space-y-2 pb-4 text-sm'>
            {isSuccessful ? (
              <p>
                Your payment has been confirmed and you’re now enrolled in <strong>{name}</strong>.
                You can start learning right away!
              </p>
            ) : (
              <>
                <p>
                  We couldn’t verify your payment for <strong>{name}</strong>. This might be due to
                  a network delay or an incomplete transaction.
                </p>
                <p>
                  If the payment was deducted, don’t worry — it’s usually resolved automatically
                  within a few minutes. You can refresh this page later or reach out to our support
                  team for help.
                </p>
              </>
            )}
          </div>

          <div className='text-muted-foreground border-t pt-2 text-xs'>
            <p>
              Reference: <code>{reference}</code>
            </p>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
