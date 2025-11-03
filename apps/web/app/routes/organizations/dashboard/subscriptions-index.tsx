import { Outlet } from 'react-router';
import { Package } from 'lucide-react';

import type { Route } from './+types/subscriptions-index';

import { Modal } from '~/components/ui/modal';

export default function SubscriptionsIndex({ params }: Route.ComponentProps) {
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

            <div className='flex flex-col items-start justify-between space-y-4 pb-4 md:flex-row md:items-center md:space-y-0'>
              <div className='flex flex-col gap-1'>
                <h1 className='text-2xl font-bold'>Available Plans</h1>
                <p className='text-muted-foreground font-secondary text-sm'>
                  Choose the perfect plan for your needs. Upgrade or downgrade anytime.
                </p>
              </div>
              <div />
            </div>
          </Modal.Body>
        </Modal.Content>
      </Modal>
      <Outlet />
    </>
  );
}
