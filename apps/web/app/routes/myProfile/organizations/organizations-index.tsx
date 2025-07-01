import { data, Outlet, useFetcher } from 'react-router';
import { LoaderCircle, Plus } from 'lucide-react';
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
import { useStore } from '~/store';

const META_TAGS = [
  { title: 'Select or Create Organization • Gonasi' },
  {
    name: 'description',
    content:
      'Choose an existing organization or create a new one to manage your courses, collaborate with your team, and grow your learning community on Gonasi.',
  },
];

export function meta() {
  return META_TAGS;
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase } = createClient(request);
  const formData = await request.formData();
  const organizationId = formData.get('organizationId');

  const validated = SetActiveOrganizationSchema.safeParse({ organizationId });
  if (!validated.success) {
    console.error(validated.error);
    return new Response('Invalid organization ID.', { status: 400 });
  }

  const { success, message } = await updateActiveOrganization({
    supabase,
    organizationId: validated.data.organizationId,
  });

  return success
    ? data({ success: true })
    : dataWithError(null, message ?? 'Failed to set active organization.');
}

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const result = await fetchUsersOrganizations(supabase);

  return {
    organizations: result.success ? result.data : [],
    total: result.total ?? 0,
    ownedCount: result.owned_count ?? 0,
    canCreateMore: result.can_create_more ?? false,
  };
}

export type OrganizationsLoaderData = Exclude<Awaited<ReturnType<typeof loader>>, Response>;
export type UserOrganizations = OrganizationsLoaderData['organizations'];
export type UserOrganization = UserOrganizations[number];

export default function OrganizationsIndex({ params, loaderData }: Route.ComponentProps) {
  const { organizations, canCreateMore } = loaderData;
  const fetcher = useFetcher();
  const { activeUserProfile, isActiveUserProfileLoading } = useStore();

  if (isActiveUserProfileLoading) return <Spinner />;

  const isSubmitting = fetcher.state !== 'idle';

  const submitActiveOrgUpdate = (organizationId: string) => {
    const formData = new FormData();
    formData.append('organizationId', organizationId);
    fetcher.submit(formData, { method: 'post' });
  };

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
          {isSubmitting && <LoaderCircle size={20} className='animate-spin' />}
        </div>

        <div className='py-4'>
          {organizations.length === 0 ? (
            <NotFoundCard message='You are not part of any organizations yet.' />
          ) : (
            <div className='flex flex-col space-y-4'>
              {organizations.map((organization) => (
                <OrganizationSwitcherCard
                  key={organization.id}
                  organization={organization}
                  activeOrganizationId={activeUserProfile?.active_organization_id ?? ''}
                  handleClick={submitActiveOrgUpdate}
                  isLoading={isSubmitting}
                />
              ))}
            </div>
          )}
        </div>

        {canCreateMore && (
          <NavLinkButton
            to={`/go/${params.username}/organizations/new`}
            variant='ghost'
            leftIcon={<Plus />}
            className='w-full'
          >
            Create New Organization
          </NavLinkButton>
        )}
      </div>

      <Outlet context={{ canCreateMore }} />
    </>
  );
}
