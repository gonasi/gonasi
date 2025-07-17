import { useOutletContext } from 'react-router';
import { CheckCircle, XCircle } from 'lucide-react';

import type { Route } from './+types/enroll-status';
import type { CoursePricingContextType } from './enroll-index';

import { Modal } from '~/components/ui/modal';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const reference = url.searchParams.get('reference');

  if (!reference) {
    throw new Response('Missing reference', { status: 400 });
  }

  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  if (!PAYSTACK_SECRET_KEY) {
    throw new Response('Paystack secret key is not configured', { status: 500 });
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Response('Failed to verify transaction with Paystack', { status: 500 });
  }

  const result = await res.json();

  return {
    reference,
    transaction: result.data,
    status: result.status,
  };
}

export default function EnrollStatus({ params, loaderData }: Route.ComponentProps) {
  const { name } = useOutletContext<CoursePricingContextType>();
  const { reference, transaction } = loaderData;

  const publishedCourseId = params.publishedCourseId;
  const isSuccessful = transaction?.status === 'success';

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header title={`Enrolling to ${name}`} closeRoute={`/c/${publishedCourseId}`} />
        <Modal.Body className='space-y-4 px-4 py-4'>
          <div className='flex items-center space-x-2'>
            {isSuccessful ? (
              <CheckCircle className='text-success h-6 w-6' />
            ) : (
              <XCircle className='text-danger h-6 w-6' />
            )}
            <h2 className='text-lg font-semibold'>
              {isSuccessful ? 'Enrollment Successful' : 'Transaction Failed'}
            </h2>
          </div>

          <div className='text-muted-foreground space-y-2 pb-4 text-sm'>
            <p>
              {isSuccessful ? (
                <>
                  You have been successfully enrolled in <strong>{name}</strong>. You can now begin
                  learning!
                </>
              ) : (
                <>
                  The transaction was not successful, and you have not been enrolled. Please try
                  again or contact support if the issue persists.
                </>
              )}
            </p>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
