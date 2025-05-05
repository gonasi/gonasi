import { Form, useNavigate } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { inviteNewStaffMemberById } from '@gonasi/database/staffInvites';
import { InviteNewStaffSchema } from '@gonasi/schemas/staffDirectory';

import type { Route } from './+types/new-staff-invite';

import { Button } from '~/components/ui/button';
import { ErrorList, Field } from '~/components/ui/forms';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: InviteNewStaffSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await inviteNewStaffMemberById(
    supabase,
    params.companyId,
    submission.value.email,
  );

  return success
    ? redirectWithSuccess(`/dashboard/${params.companyId}/team-management/staff-directory`, message)
    : dataWithError(null, message);
}

export default function NewStaffMember({ actionData, params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const [form, fields] = useForm({
    id: 'invite-new-staff-member-form',
    constraint: getZodConstraint(InviteNewStaffSchema),
    lastResult: actionData?.result,
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate: ({ formData }) => parseWithZod(formData, { schema: InviteNewStaffSchema }),
  });

  const isPending = useIsPending();

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/team-management/staff-invites`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header title='Invite a New Team Member' />
        <Modal.Body>
          <Form method='POST' {...getFormProps(form)}>
            <HoneypotInputs />

            <Field
              labelProps={{ children: 'Email Address', required: true }}
              inputProps={{
                ...getInputProps(fields.email, { type: 'email' }),
                autoFocus: true,
                disabled: isPending,
              }}
              errors={fields.email?.errors}
            />

            <ErrorList errors={form.errors} id={form.errorId} />

            <Button type='submit' disabled={isPending} isLoading={isPending}>
              Send Invitation
            </Button>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
