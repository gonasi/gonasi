import { useEffect, useState } from 'react';
import { data, useFetcher, useNavigate } from 'react-router';
import { Check } from 'lucide-react';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';

import { editStaffRole, fetchStaffMemberById } from '@gonasi/database/staffMembers';

import type { Route } from './+types/edit-staff-role';

import { PlainButton } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const staff = await fetchStaffMemberById(supabase, params.staffId, params.companyId);

  if (!staff)
    return redirectWithError(
      `/dashboard/${params.companyId}/team-management/staff-directory`,
      'Staff member not found',
    );

  return data(staff);
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  const staffRole = formData.get('staffRole') as 'user' | 'admin' | null;

  if (!staffRole) {
    return dataWithError(null, 'Missing staff role');
  }

  const { supabase } = createClient(request);

  const { success, message } = await editStaffRole(
    supabase,
    params.staffId,
    params.companyId,
    staffRole,
  );

  return success
    ? redirectWithSuccess(`/dashboard/${params.companyId}/team-management/staff-directory`, message)
    : dataWithError(null, message);
}

export default function EditStaffRole({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const userRoles = ['admin', 'user'];

  const [loading, setLoading] = useState(false);

  // Set up an effect to monitor fetcher state
  useEffect(() => {
    if (fetcher.state === 'submitting') {
      setLoading(true);
    } else if (fetcher.state === 'idle' && fetcher.data) {
      setLoading(false);
    }
  }, [fetcher.state, fetcher.data]);

  const handleSave = (staffRole: string) => {
    const formData = new FormData();
    formData.append('staffRole', staffRole);

    fetcher.submit(formData, {
      method: 'post',
    });
  };

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/team-management/staff-directory`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header title={`Edit Staff Role - (${loaderData.staff_profile.username})`} />
        <Modal.Body>
          <div className='flex flex-col space-y-4'>
            {userRoles.map((role) => {
              return (
                <PlainButton
                  key={role}
                  className={cn('w-full', 'bg-card/10 rounded-md p-4', {
                    'bg-card cursor-not-allowed': loaderData.staff_role === role || loading,
                  })}
                  onClick={() => loaderData.staff_role !== role && handleSave(role)}
                  disabled={loaderData.staff_role === role || loading}
                >
                  <div className='flex w-full items-center justify-between'>
                    <div>{role}</div>
                    <div>{loaderData.staff_role === role ? <Check /> : null}</div>
                  </div>
                </PlainButton>
              );
            })}
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
