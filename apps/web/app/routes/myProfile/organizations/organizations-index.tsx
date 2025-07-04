import { Outlet, useFetcher } from 'react-router';
import { Check, Plus } from 'lucide-react';
import { dataWithError, redirectWithSuccess } from 'remix-toast';

import {
  fetchUsersOrganizations,
  switchToPersonalMode,
  updateActiveOrganization,
} from '@gonasi/database/organizations';
import { SetActiveOrganizationSchema } from '@gonasi/schemas/organizations';

import type { Route } from './+types/organizations-index';

import { PlainAvatar } from '~/components/avatars';
import { BannerCard, NotFoundCard } from '~/components/cards';
import OrganizationSwitcherCard from '~/components/cards/organization-switcher/organization-switcher-card';
import { Spinner } from '~/components/loaders';
import { BackArrowNavLink, NavLinkButton } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';
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

  // If no organizationId, switch to personal mode
  if (!organizationId) {
    const { success, message, data } = await switchToPersonalMode({ supabase });
    return success ? redirectWithSuccess(`/go/${data?.id}`, message) : dataWithError(null, message);
  }

  const validated = SetActiveOrganizationSchema.safeParse({ organizationId });
  if (!validated.success) {
    console.error(validated.error);
    return new Response('Invalid organization ID.', { status: 400 });
  }

  const { success, message, data } = await updateActiveOrganization({
    supabase,
    organizationId: validated.data.organizationId,
  });

  return success
    ? redirectWithSuccess(`/${data?.active_organization_id}/dashboard`, message)
    : dataWithError(null, message);
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

  const submitSwitchToPersonalMode = () => {
    const formData = new FormData();
    fetcher.submit(formData, { method: 'post' });
  };

  const isModePersonal = activeUserProfile?.mode === 'personal';

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

        <div className='w-full items-center pt-4'>
          <div className='flex w-full items-center space-x-4'>
            <BackArrowNavLink
              to={
                isModePersonal
                  ? `/go/${params.username}`
                  : `/${activeUserProfile?.active_organization_id}`
              }
            />
            <h2 className='mt-1 w-full flex-shrink-0 text-lg'>Switch Organizations</h2>
          </div>
        </div>

        <h4 className='text-muted-foreground my-2 text-sm'>Personal</h4>
        <div className={cn('')}>
          <Card
            className={cn(
              'flex flex-row items-center gap-4 rounded-lg border p-4 transition-colors duration-200 ease-in-out',
              'bg-card/60',
              fetcher.state !== 'idle' && 'opacity-80',
              isModePersonal
                ? 'border-primary/20 bg-card cursor-default hover:cursor-not-allowed'
                : 'border-card hover:border-muted-foreground/20 hover:bg-muted/50 cursor-pointer',
            )}
            onClick={() => {
              if (!isModePersonal && !isSubmitting) {
                submitSwitchToPersonalMode();
              }
            }}
          >
            <div className='flex w-full items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <PlainAvatar
                  username={activeUserProfile?.username ?? ''}
                  imageUrl={activeUserProfile?.signed_url}
                  size='md'
                  isPending={fetcher.state !== 'idle' && !fetcher.formData?.get('organizationId')}
                />
                <p>{activeUserProfile?.full_name}</p>
              </div>
              {isModePersonal ? (
                <div className='text-primary flex items-center gap-2'>
                  <Check className='h-5 w-5' />
                  <span className='hidden text-sm font-medium sm:block'>Current</span>
                </div>
              ) : (
                <div />
              )}
            </div>
          </Card>
        </div>

        <h4 className='text-muted-foreground my-2 text-sm'>Organizations</h4>
        <div className='pb-8'>
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
                  pendingOrganizationId={String(fetcher.formData?.get('organizationId') ?? '')}
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
