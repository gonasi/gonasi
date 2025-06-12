import { memo } from 'react';
import { Form, useOutletContext } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, CircleOff, HandCoins } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { setCourseFree, setCoursePaid } from '@gonasi/database/courses';
import {
  UpdateCoursePricingTypeSchema,
  type UpdateCoursePricingTypeSchemaTypes,
} from '@gonasi/schemas/coursePricing';

import type { Route } from './+types/update-pricing-type-modal';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(UpdateCoursePricingTypeSchema);

const Tag = memo(
  ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <span className={`bg-card/50 text-foreground rounded px-1 py-0.5 font-medium ${className}`}>
      {children}
    </span>
  ),
);
Tag.displayName = 'Tag';

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

export default function UpdatePricingTypeModal({ params }: Route.ComponentProps) {
  const { username, courseId } = params;

  const { isPaid } = useOutletContext<{ isPaid: boolean }>() ?? {};

  const isPending = useIsPending();

  const closeRoute = `/${username}/course-builder/${courseId}/pricing`;

  const nextType = isPaid ? 'Free' : 'Paid';

  const methods = useRemixForm<UpdateCoursePricingTypeSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: { setToType: isPaid ? 'free' : 'paid' },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header closeRoute={closeRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />
              <div className='flex items-center justify-center pb-4'>
                <CircleAlert className={cn(isPaid ? 'text-secondary' : 'text-primary')} size={40} />
              </div>

              <h2 className='text-center text-xl'>Course Pricing</h2>
              <p className='text-muted-foreground font-secondary text-center'>
                {`You're `} about to switch from <Tag>{capitalize(isPaid ? 'Paid' : 'Free')}</Tag>{' '}
                to <Tag>{nextType}</Tag> pricing.
              </p>

              <div className='space-y-3 py-6'>
                <ul className='text-muted-foreground font-secondary list-disc space-y-3 pl-5 leading-relaxed'>
                  {isPaid ? (
                    <li>
                      This will <Tag className='bg-danger/50'>delete 🗑️</Tag> all your current{' '}
                      <Tag>paid options</Tag> and add the{' '}
                      <span className='text-warning font-medium'>free default pricing option</span>.
                    </li>
                  ) : (
                    <li>
                      This will remove the{' '}
                      <span className='text-warning font-medium'>free default pricing option</span>{' '}
                      and set up a{' '}
                      <span className='text-foreground font-medium'>default paid option</span>. You
                      can tweak or add more paid options later. 💸
                    </li>
                  )}
                </ul>

                <p className='text-muted-foreground font-secondary px-2 pt-4 text-sm'>
                  <strong>Note:</strong> Current users keep their pricing until their plan ends. To
                  get the new rate, they’ll need to re-enroll.
                </p>
              </div>

              <div className='px-1 py-4'>
                <Button
                  variant={isPaid ? 'secondary' : 'default'}
                  className='w-full'
                  leftIcon={isPaid ? <CircleOff /> : <HandCoins />}
                  type='submit'
                  disabled={isDisabled}
                  isLoading={isDisabled}
                >
                  Switch to {nextType}
                </Button>
              </div>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
