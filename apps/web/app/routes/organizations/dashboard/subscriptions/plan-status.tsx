import { CheckCircle } from 'lucide-react';

import { organizationTierLimitsSummary } from '@gonasi/database/organizations';

import type { Route } from './+types/plan-status';

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

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { organizationId } = params;

  const orgSummary = organizationTierLimitsSummary({
    supabase,
    organizationId,
  });

  return orgSummary;
}

export default function PlanStatus({ params, loaderData }: Route.ComponentProps) {
  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='Subscription Payment Verification'
          closeRoute={`/${params.organizationId}/dashboard/subscriptions`}
        />
        <Modal.Body className='space-y-4 px-4 py-4'>
          <div className='flex items-center space-x-2'>
            <CheckCircle className='text-success h-6 w-6' />
          </div>

          <div className='text-muted-foreground space-y-2 pb-4 text-sm' />

          <div className='text-muted-foreground border-t pt-2 text-xs' />
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
