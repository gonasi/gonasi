import { data, Form, useLocation, useNavigate } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { CircleAlert, Trash2 } from 'lucide-react';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { getCompanyProfileById } from '@gonasi/database/profile';
import { canUserExitFromTeam, deleteUserFromTeamStaffMembers } from '@gonasi/database/staffMembers';
import { LeaveTeamSchema } from '@gonasi/schemas/staffDirectory';

import type { Route } from './+types/leave-team';

import { Button } from '~/components/ui/button';
import { ErrorList } from '~/components/ui/forms';
import { Input } from '~/components/ui/input';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [userExit, company] = await Promise.all([
    canUserExitFromTeam(supabase, params.companyId),
    getCompanyProfileById(supabase, params.companyId),
  ]);

  if (!userExit) return redirectWithError('', 'some stuff');

  if (!company) return redirectWithError('', 'some stuff');

  return data({ userExit, company });
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const submission = parseWithZod(formData, { schema: LeaveTeamSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await deleteUserFromTeamStaffMembers(
    supabase,
    submission.value.companyId,
  );

  return success
    ? redirectWithSuccess(
        submission.value.redirect ||
          `/dashboard/${params.companyId}/team-management/staff-directory`,
        message,
      )
    : dataWithError(null, message);
}

export default function ChangeTeam({ actionData, loaderData, params }: Route.ComponentProps) {
  const { company } = loaderData;

  const navigate = useNavigate();
  const location = useLocation();

  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: 'leave-team-form',
    constraint: getZodConstraint(LeaveTeamSchema),
    lastResult: actionData?.result,
    defaultValue: {
      companyId: company.id,
      redirect: location.state?.from,
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: LeaveTeamSchema });
    },
  });

  const handleClose = () =>
    navigate(
      location.state?.from || `/dashboard/${params.companyId}/team-management/staff-directory`,
    );

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header />
        <Modal.Body>
          <Form method='POST' {...getFormProps(form)}>
            <HoneypotInputs />

            <Input {...getInputProps(fields.companyId, { type: 'text' })} hidden />
            <Input {...getInputProps(fields.redirect, { type: 'text' })} hidden />
            <ErrorList errors={form.errors} id={form.errorId} />
            <div>
              <div className='flex items-center justify-center pb-4'>
                <CircleAlert className='text-danger h-12 w-12' />
              </div>
              <h2 className='font-secondary text-muted-foreground text-center'>
                Are you sure you want to leave the team{' '}
                <span className='font-primary text-foreground'>{company.full_name}</span>?
              </h2>
              <p className='font-secondary text-muted-foreground pt-2 text-center text-xs'>
                Once you leave, you will lose access to this team. This action cannot be undone.
              </p>
              <div className='flex flex-col space-y-4 pt-4'>
                <Button
                  type='submit'
                  disabled={isPending}
                  isLoading={isPending}
                  variant='danger'
                  rightIcon={<Trash2 />}
                >
                  Leave
                </Button>
                <Button type='button' disabled={isPending} variant='ghost' onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
