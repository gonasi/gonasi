import { Outlet } from 'react-router';
import { Package } from 'lucide-react';
import { redirectWithError } from 'remix-toast';

import { fetchOrganizationSubscriptionStatus } from '@gonasi/database/organizationSubscriptions';

import type { Route } from './+types/subscriptions-index';
import { ActiveSubCard } from '../components/ActiveSubCard';
import { PricingComparisonTable } from '../components/PricingComparisonTable';

import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { organizationId } = params;

  const sub = await fetchOrganizationSubscriptionStatus({ supabase, organizationId });

  if (!sub.success) {
    return redirectWithError(
      `/${params.organizationId}/builder`,
      sub.message || 'You do not have permission',
    );
  }

  return sub;
}

export default function SubscriptionsIndex({ params, loaderData }: Route.ComponentProps) {
  return (
    <>
      <Modal open>
        <Modal.Content size='full'>
          <Modal.Header
            title='Subscription Hub'
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
            <div className='flex max-w-5xl flex-col space-y-4 space-x-0 md:flex-row md:space-y-4 md:space-x-4'>
              <div className='w-full md:w-2/3'>
                <ActiveSubCard
                  subscription={loaderData.data.subscription}
                  tier={loaderData.data.tier}
                />
              </div>
              <div className='w-full md:w-1/3' />
            </div>
            <div className='py-8'>
              <div className='mb-12 text-center'>
                <h1 className='mb-2 text-3xl font-bold text-balance sm:text-4xl'>
                  Simple, Transparent Pricing
                </h1>
                <p className='text-muted-foreground font-secondary text-base sm:text-lg'>
                  Choose the plan that fits your needs. Always flexible to scale.
                </p>
              </div>
              <PricingComparisonTable
                allTiers={loaderData.data.allTiers}
                activeTier={loaderData.data.tier}
                canSubToLaunchTier={loaderData.data.canSubToLaunchTier}
              />
            </div>
          </Modal.Body>
        </Modal.Content>
      </Modal>
      <Outlet />
    </>
  );
}
