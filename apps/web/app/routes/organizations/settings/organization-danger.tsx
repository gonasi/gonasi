import { Outlet, useOutletContext } from 'react-router';
import { LogOut } from 'lucide-react';

import type { Route } from './+types/organization-danger';

import { BannerCard } from '~/components/cards';
import { NavLinkButton } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import type { OrganizationsOutletContextType } from '~/routes/layouts/organizations/organizations-layout';

export default function OrganizationDanger({ params }: Route.ComponentProps) {
  const { data } = useOutletContext<OrganizationsOutletContextType>();

  return (
    <>
      <div className='flex max-w-lg flex-col space-y-10 md:space-y-12'>
        {data.orgRole === 'owner' ? (
          <div className='px-4 pb-8'>
            <BannerCard
              message='Coming soon'
              description="You'll soon be able to transfer ownership of your organization to another member."
              showCloseIcon={false}
              variant='warning'
            />
          </div>
        ) : (
          <Card className='w-full max-w-md border-none bg-transparent shadow-none'>
            <CardHeader>
              <CardTitle className='text-lg'>Leave Organization</CardTitle>
              <CardDescription className='font-secondary'>
                {`Once you leave, you'll lose access to all organization resources and data.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NavLinkButton
                variant='danger'
                className='w-full'
                rightIcon={<LogOut />}
                to={`/${params.organizationId}/settings/organization-danger/leave`}
              >
                Leave Organization
              </NavLinkButton>
            </CardContent>
          </Card>
        )}
      </div>
      <Outlet context={{ data }} />
    </>
  );
}
