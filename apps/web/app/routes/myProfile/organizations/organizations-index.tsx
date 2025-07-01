import { Outlet, useFetcher } from 'react-router';
import { Plus } from 'lucide-react';

import { fetchUsersOrganizations } from '@gonasi/database/organizations';

import type { Route } from './+types/organizations-index';

import { AppLogo } from '~/components/app-logo';
import { BannerCard, NotFoundCard } from '~/components/cards';
import OrganizationSwitcherCard from '~/components/cards/organization-switcher/organization-switcher-card';
import { Spinner } from '~/components/loaders';
import { BackArrowNavLink, NavLinkButton } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';
import { useStore } from '~/store';

export function meta() {
  return [
    { title: 'Select or Create Organization • Gonasi' },
    {
      name: 'description',
      content:
        'Choose an existing organization or create a new one to manage your courses, collaborate with your team, and grow your learning community on Gonasi.',
    },
  ];
}

export type LoaderData = Exclude<Awaited<ReturnType<typeof loader>>, Response>;
export type UserOrganizations = LoaderData['organizations'];
export type UserOrganization = UserOrganizations[number];

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const result = await fetchUsersOrganizations(supabase);

  if (!result.success) {
    return { organizations: [] };
  }

  return {
    organizations: result.data,
    total: result.total,
    ownedCount: result.owned_count,
    canCreateMore: result.can_create_more,
  };
}

export default function OrganizationsIndex({ params, loaderData }: Route.ComponentProps) {
  const { organizations, canCreateMore } = loaderData;
  const fetcher = useFetcher();
  const { activeUserProfile, isActiveUserProfileLoading } = useStore();

  if (isActiveUserProfileLoading) return <Spinner />;

  return (
    <>
      <div className='mx-auto flex max-w-lg flex-col space-y-4 px-4 md:py-10'>
        {!canCreateMore ? (
          <BannerCard
            showCloseIcon={false}
            variant='warning'
            message='Launch Plan Limit'
            description='You can own up to 2 organizations on the Launch Plan. Upgrade an existing organization to create more.'
            className='mt-4 md:mt-0'
          />
        ) : null}
        <div className='grid grid-cols-3 items-center py-4'>
          <div className='w-fit'>
            <BackArrowNavLink to={`/go/${params.username}`} />
          </div>
          <div className='flex w-full items-center justify-center'>
            <AppLogo />
          </div>
          <div />
        </div>

        <div className='flex items-center justify-between'>
          <h4 className='text-lg font-semibold'>Your Organizations</h4>
        </div>

        <div className='py-4'>
          <div className='flex flex-col space-y-4'>
            {organizations.length > 0 ? (
              organizations.map((organization) => (
                <OrganizationSwitcherCard
                  key={organization.id}
                  data={organization}
                  activeOrganizationId={activeUserProfile?.active_organization_id ?? ''}
                />
              ))
            ) : (
              <NotFoundCard message='You are not part of any organizations yet.' />
            )}
          </div>
        </div>

        <div>
          {canCreateMore ? (
            <NavLinkButton
              to={`/go/${params.username}/organizations/new`}
              variant='ghost'
              leftIcon={<Plus />}
              className={cn('w-full')}
            >
              Create New Organization
            </NavLinkButton>
          ) : null}
        </div>
      </div>
      <Outlet />
    </>
  );
}
