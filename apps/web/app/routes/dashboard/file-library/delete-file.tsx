import { data, Form, useNavigate } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { deleteFile, fetchFileById } from '@gonasi/database/files';
import { DeleteFileSchema } from '@gonasi/schemas/file';

import type { Route } from './+types/delete-file';

import { DeleteConfirmationLayout } from '~/components/layouts/modals';
import { ErrorList } from '~/components/ui/forms';
import { Input } from '~/components/ui/input';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const file = await fetchFileById(supabase, params.fileId);

  if (file === null)
    return redirectWithError(`/dashboard/${params.companyId}/file-library`, 'File does not exist');

  return data({
    name: file.name,
    path: file.path,
  });
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: DeleteFileSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await deleteFile(supabase, {
    ...submission.value,
    fileId: params.fileId,
  });

  return success
    ? redirectWithSuccess(
        `/dashboard/${params.companyId}/file-library/${params.fileId}/edit`,
        message,
      )
    : dataWithError(null, message);
}

export default function DeleteFile({ loaderData, actionData, params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: 'delete-file-form',
    constraint: getZodConstraint(DeleteFileSchema),
    lastResult: actionData?.result,
    defaultValue: loaderData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: DeleteFileSchema });
    },
  });

  const handleClose = () => navigate(`/dashboard/${params.companyId}/file-library`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header />
        <Modal.Body>
          <Form method='POST' {...getFormProps(form)}>
            <HoneypotInputs />
            <Input {...getInputProps(fields.path, { type: 'text' })} hidden />
            <Input {...getInputProps(fields.name, { type: 'text' })} hidden />
            <p className='py-2 text-center text-sm'>
              Blocks using this file will be have a default file placeholder
            </p>
            <ErrorList errors={form.errors} id={form.errorId} />
            <DeleteConfirmationLayout
              title={loaderData.name}
              isLoading={isPending}
              handleClose={handleClose}
            />
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
