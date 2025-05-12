import { data, Form, useNavigate } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { editFile, fetchFileById } from '@gonasi/database/files';
import { EditFileSchema } from '@gonasi/schemas/file';

import type { Route } from './+types/edit-file-image';

import { Button } from '~/components/ui/button';
import { ErrorList, Field } from '~/components/ui/forms';
import { Input } from '~/components/ui/input';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const file = await fetchFileById(supabase, params.fileId);

  if (file === null)
    return redirectWithError(`/dashboard/${params.companyId}/file-library`, 'File does not exist');

  return data(file);
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: EditFileSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await editFile(supabase, {
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

export default function EditFileImage({ loaderData, actionData, params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: 'edit-file-form',
    constraint: getZodConstraint(EditFileSchema),
    lastResult: actionData?.result,
    defaultValue: {
      file: null,
      path: loaderData.path,
    },
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EditFileSchema });
    },
  });

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/file-library/${params.fileId}/edit`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header title='Update File' />
        <Modal.Body>
          <Form method='POST' encType='multipart/form-data' {...getFormProps(form)}>
            <HoneypotInputs />
            <Field
              labelProps={{ children: 'File', required: true }}
              inputProps={{ ...getInputProps(fields.file, { type: 'file' }), disabled: isPending }}
              errors={fields.file?.errors}
              description='Upload a new file to replace the current one.'
            />

            <Input {...getInputProps(fields.path, { type: 'hidden' })} />
            <ErrorList errors={form.errors} id={form.errorId} />
            <Button type='submit' disabled={isPending} isLoading={isPending}>
              Save
            </Button>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
