import { Outlet } from 'react-router';
import { Plus } from 'lucide-react';

import type { Route } from './+types/payout-settings';

import { NavLinkButton } from '~/components/ui/button';

export function meta() {
  return [
    { title: 'Get Paid for Your Courses | Gonasi' },
    {
      name: 'description',
      content:
        'Connect your payout account and start earning from your interactive content. It only takes a minute to set up!',
    },
  ];
}

export default function PayoutSettings({ params }: Route.ComponentProps) {
  return (
    <>
      <div>
        <div>
          <h2 className='py-2 text-xl'>Payout Settings</h2>
          <p className='font-secondary text-muted-foreground'>
            Let’s get you paid! 🎉 We’ll create a Paystack subaccount where your earnings go when
            people purchase your interactive content on Gonasi. It’s quick, easy, and super
            important!
          </p>
        </div>

        <div className='h-full py-4'>
          <NavLinkButton
            to={`/${params.username}/settings/payout-settings/add-payout-details`}
            leftIcon={<Plus />}
          >
            Add Payout Details
          </NavLinkButton>
        </div>
      </div>
      <Outlet />
    </>
  );
}
