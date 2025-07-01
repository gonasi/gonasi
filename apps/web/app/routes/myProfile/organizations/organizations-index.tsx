import { data, Outlet, useFetcher } from 'react-router';
import { Plus } from 'lucide-react';
import { dataWithError } from 'remix-toast';

import { fetchUsersOrganizations, updateActiveOrganization } from '@gonasi/database/organizations';
import { SetActiveOrganizationSchema } from '@gonasi/schemas/organizations';

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

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const { supabase } = createClient(request);

  const organizationId = formData.get('organizationId');
  if (typeof organizationId !== 'string') {
    return new Response('Invalid input: expected organizationId string.', { status: 400 });
  }

  const validatedInput = SetActiveOrganizationSchema.safeParse({ organizationId });
  if (!validatedInput.success) {
    console.error(validatedInput.error);
    return new Response('Invalid organization ID.', { status: 400 });
  }

  const updateResult = await updateActiveOrganization({ supabase, organizationId });

  return updateResult.success
    ? data({ success: true })
    : dataWithError(null, updateResult.message ?? 'Failed to set active organization.');
}

export type OrganizationsLoaderData = Exclude<Awaited<ReturnType<typeof loader>>, Response>;
export type UserOrganizations = OrganizationsLoaderData['organizations'];
export type UserOrganization = UserOrganizations[number];

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const orgFetchResult = await fetchUsersOrganizations(supabase);

  if (!orgFetchResult.success) {
    return { organizations: [] };
  }

  return {
    organizations: orgFetchResult.data,
    total: orgFetchResult.total,
    ownedCount: orgFetchResult.owned_count,
    canCreateMore: orgFetchResult.can_create_more,
  };
}

export default function OrganizationsIndex({ params, loaderData }: Route.ComponentProps) {
  const { organizations, canCreateMore } = loaderData;
  const fetcher = useFetcher();
  const { activeUserProfile, isActiveUserProfileLoading } = useStore();

  if (isActiveUserProfileLoading) return <Spinner />;

  function submitActiveOrgUpdate(organizationId: string) {
    const formData = new FormData();
    formData.append('organizationId', organizationId);
    fetcher.submit(formData, { method: 'post' });
  }

  return (
    <>
      <div className='mx-auto flex max-w-lg flex-col space-y-4 px-4 md:py-10'>
        {!canCreateMore && (
          <BannerCard
            showCloseIcon={false}
            variant='warning'
            message='Launch Plan Limit'
            description='You can own up to 2 organizations on the Launch Plan. Upgrade an existing organization to create more.'
            className='mt-4 md:mt-0'
          />
        )}

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
                  organization={organization}
                  activeOrganizationId={activeUserProfile?.active_organization_id ?? ''}
                  handleClick={submitActiveOrgUpdate}
                />
              ))
            ) : (
              <NotFoundCard message='You are not part of any organizations yet.' />
            )}
          </div>
        </div>

        {canCreateMore && (
          <NavLinkButton
            to={`/go/${params.username}/organizations/new`}
            variant='ghost'
            leftIcon={<Plus />}
            className={cn('w-full')}
          >
            Create New Organization
          </NavLinkButton>
        )}
      </div>

      <Outlet context={{ canCreateMore }} />
    </>
  );
}
