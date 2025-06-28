import { Outlet } from 'react-router';
import { Plus } from 'lucide-react';

import { fetchUsersOrganizations } from '@gonasi/database/organizations';

import type { Route } from './+types/organizations-index';

import { AppLogo } from '~/components/app-logo';
import { UserAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { BackArrowNavLink, NavLinkButton } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const result = await fetchUsersOrganizations(supabase);

  if (!result.success) {
    return { organizations: [] };
  }

  return { organizations: result.data };
}
export default function PastIndex({ params, loaderData }: Route.ComponentProps) {
  const { organizations } = loaderData;
  return (
    <>
      <div className='mx-auto flex max-w-md flex-col space-y-4 px-4 md:py-10'>
        <div className='grid grid-cols-3 items-center py-4'>
          <div className='w-fit'>
            <BackArrowNavLink to={`/go/${params.username}`} />
          </div>
          <div className='flex w-full items-center justify-center'>
            <AppLogo />
          </div>
          <div />
        </div>
        <div className='flex w-full items-center justify-between'>
          <div>
            <h4>Organizations</h4>
          </div>
        </div>
        <div className='py-4'>
          <div className='flex flex-col space-y-4'>
            {organizations && organizations.length > 0 ? (
              organizations.map(
                ({
                  id,
                  role,
                  organization: { id: orgId, name, handle, avatar_url, blur_hash },
                }) => (
                  <div
                    key={id}
                    className='bg-input/20 flex items-center justify-between rounded-lg p-2'
                  >
                    <UserAvatar username={name} imageUrl={avatar_url} size='sm' />
                  </div>
                ),
              )
            ) : (
              <NotFoundCard message='No orgs found' />
            )}
          </div>
        </div>

        <div>
          <NavLinkButton
            to={`/go/${params.username}/organizations/new`}
            variant='ghost'
            size='sm'
            leftIcon={<Plus />}
            className={cn('border-border/50 w-full border')}
          >
            Create Organization
          </NavLinkButton>
        </div>
      </div>
      <Outlet />
    </>
  );
}
