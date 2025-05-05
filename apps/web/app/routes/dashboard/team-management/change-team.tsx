import { useEffect, useState } from 'react';
import { data, Outlet, useFetcher, useLocation, useOutletContext } from 'react-router';
import { Check, Trash } from 'lucide-react';

import { getUserId } from '@gonasi/database/auth';
import { fetchAllUsersCompanies } from '@gonasi/database/staffMembers';

import type { Route } from './+types/change-team';

import { ActionDropdown } from '~/components/action-dropdown';
import { UserAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { StepperFormLayout } from '~/components/layouts/stepper';
import { PlainButton } from '~/components/ui/button';
import type { AppOutletContext } from '~/lib/supabase/supabase';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [usersCompanies, userId] = await Promise.all([
    fetchAllUsersCompanies(supabase),
    getUserId(supabase),
  ]);

  return data({ usersCompanies, userId });
}

export default function ChangeTeam({ loaderData, params }: Route.ComponentProps) {
  const { activeCompany } = useOutletContext<AppOutletContext>();

  const { usersCompanies, userId } = loaderData;

  const location = useLocation();
  const fetcher = useFetcher();

  const [loading, setLoading] = useState(false);

  // Set up an effect to monitor fetcher state
  useEffect(() => {
    if (fetcher.state === 'submitting') {
      setLoading(true);
    } else if (fetcher.state === 'idle' && fetcher.data) {
      setLoading(false);
    }
  }, [fetcher.state, fetcher.data]);

  const handleSave = (companyId: string) => {
    const formData = new FormData();
    formData.append('companyId', companyId);
    formData.append('redirect', location.state?.from);

    fetcher.submit(formData, {
      method: 'post',
      action: '/',
    });
  };

  return (
    <>
      <StepperFormLayout
        closeLink={`${location.state?.from ?? `/dashboard/${activeCompany?.company_id}/team-management/staff-directory`}`}
        desktopTitle='Change Team'
        mobileTitle='Change Team'
        companyId={params.companyId ?? ''}
      >
        {usersCompanies?.length ? (
          usersCompanies.map((team) => (
            <div
              key={team.profile.id}
              className={cn('flex items-center justify-between space-x-2 rounded-lg px-4 py-2', {
                'hover:bg-primary/5 hover:scale-[1.001] hover:cursor-pointer': !team.is_selected,
                'cursor-not-allowed opacity-50': team.is_selected,
              })}
            >
              <PlainButton
                disabled={team.is_selected || loading}
                onClick={() => !team.is_selected && handleSave(team.profile.id)}
                className={cn('w-full', 'flex items-center justify-between transition-all', {
                  'pointer-events-none opacity-50': team.is_selected || loading,
                })}
              >
                <div className='flex w-full items-center justify-between'>
                  <UserAvatar username={team.profile.username} fullName={team.profile.full_name} />
                  <div className='flex items-center space-x-2'>
                    {team.is_selected ? <Check /> : null}
                  </div>
                </div>
              </PlainButton>
              {team.profile.id === userId || team.is_selected ? null : (
                <ActionDropdown
                  items={[
                    {
                      title: 'Leave Team',
                      icon: Trash,
                      to: `/dashboard/change-team/leave-team/${team.profile.id}`,
                      from: location.pathname,
                    },
                  ]}
                />
              )}
            </div>
          ))
        ) : (
          <NotFoundCard message='Teams not found' />
        )}
      </StepperFormLayout>
      <Outlet />
    </>
  );
}
