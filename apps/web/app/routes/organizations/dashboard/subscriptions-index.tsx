import { Outlet } from 'react-router';
import { Package } from 'lucide-react';

import { fetchOrganizationSubscriptionStatus } from '@gonasi/database/organizationSubscriptions';

import type { Route } from './+types/subscriptions-index';
import { ActiveSubCard } from './components/ActiveSubCard';

import { NotFoundCard } from '~/components/cards';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { organizationId } = params;

  const subscription = await fetchOrganizationSubscriptionStatus({ supabase, organizationId });

  return subscription;
}

export default function SubscriptionsIndex({ params, loaderData }: Route.ComponentProps) {
  if (loaderData?.success === false) {
    return <NotFoundCard message='Subscription not found' />;
  }

  return (
    <>
      <Modal open>
        <Modal.Content size='full'>
          <Modal.Header
            title='SubscriptionHub'
            closeRoute={`/${params.organizationId}/dashboard`}
            leadingIcon={<Package />}
          />
          <Modal.Body className='px-4'>
            <div className='flex flex-col items-start justify-between space-y-4 pb-4 md:flex-row md:items-center md:space-y-0'>
              <div className='flex flex-col gap-1'>
                <h1 className='text-2xl font-bold'>Manage Subscription</h1>
                <p className='text-muted-foreground font-secondary text-sm'>
                  View your current plan, upgrade, or manage billing information
                </p>
              </div>
              <div />
            </div>
            <div className='flex flex-col space-y-4 space-x-0 border md:flex-row md:space-y-4 md:space-x-4'>
              <div className='w-full md:w-2/3'>
                <ActiveSubCard />
              </div>
              <div className='w-full md:w-1/3'>
                <h2>hey</h2>
              </div>
            </div>
          </Modal.Body>
        </Modal.Content>
      </Modal>
      <Outlet />
    </>
  );
}
