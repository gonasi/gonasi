import { organizationTierLimitsSummary } from '@gonasi/database/organizations';

import type { Route } from './+types/plan-status';

import { BannerCard } from '~/components/cards';
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

  const orgSummary = await organizationTierLimitsSummary({
    supabase,
    organizationId,
  });

  return orgSummary;
}

export default function PlanStatus({ params, loaderData }: Route.ComponentProps) {
  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title='Plan Status'
          closeRoute={`/${params.organizationId}/dashboard/subscriptions`}
        />
        <Modal.Body className='space-y-4 px-4 py-4'>
          {!loaderData.data ? (
            <BannerCard message={loaderData.message} showCloseIcon={false} variant='error' />
          ) : (
            <div>
              {loaderData.data.allIssues.map((issue, index) => {
                return <p key={index}>{issue}</p>;
              })}
            </div>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
