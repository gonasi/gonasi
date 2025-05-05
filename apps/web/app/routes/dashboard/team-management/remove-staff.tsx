import { useEffect, useState } from 'react';
import { data, useFetcher, useNavigate } from 'react-router';
import { CircleAlert, Trash2 } from 'lucide-react';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';

import { deleteStaffMemberByAdmin, fetchStaffMemberById } from '@gonasi/database/staffMembers';

import type { Route } from './+types/edit-staff-role';

import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

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
  const { supabase } = createClient(request);

  const { success, message } = await deleteStaffMemberByAdmin(
    supabase,
    params.companyId,
    params.staffId,
  );

  return success
    ? redirectWithSuccess(`/dashboard/${params.companyId}/team-management/staff-directory`, message)
    : dataWithError(null, message);
}

export default function DeleteStaffMember({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [loading, setLoading] = useState(false);

  // Set up an effect to monitor fetcher state
  useEffect(() => {
    if (fetcher.state === 'submitting') {
      setLoading(true);
    } else if (fetcher.state === 'idle') {
      setLoading(false);
    }
  }, [fetcher.state, fetcher.data]);

  const handleRemove = () => {
    const formData = new FormData();
    formData.append('intent', 'DELETE');

    fetcher.submit(formData, {
      method: 'post',
    });
  };

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/team-management/staff-directory`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header title='Remove Staff Member' />
        <Modal.Body>
          <div>
            <div className='flex items-center justify-center pb-4'>
              <CircleAlert className='text-danger h-12 w-12' />
            </div>
            <h2 className='font-secondary text-muted-foreground text-center'>
              Are you sure you want remove{' '}
              <span className='font-primary text-foreground'>
                {loaderData.staff_profile.full_name} - ({loaderData.staff_profile.username})
              </span>{' '}
              from the team?
            </h2>
            <p className='font-secondary text-muted-foreground pt-2 text-center text-xs'>
              Once you remove, they will lose access to this team. This action cannot be undone.
            </p>
            <div className='flex flex-col space-y-4 pt-4'>
              <Button
                type='submit'
                disabled={loading}
                isLoading={loading}
                variant='danger'
                rightIcon={<Trash2 />}
                onClick={handleRemove}
              >
                Remove
              </Button>
              <Button type='button' disabled={loading} variant='ghost' onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
