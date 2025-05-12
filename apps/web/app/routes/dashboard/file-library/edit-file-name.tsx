import { data, Form, useNavigate } from 'react-router';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { Pencil } from 'lucide-react';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';

import { editFileName, fetchFileById } from '@gonasi/database/files';
import { EditFileNameSchema } from '@gonasi/schemas/file';

import type { Route } from './+types/edit-file-name';

import FileNodeRenderer from '~/components/file-renderers/file-node-renderer';
import { Button, OutlineButton } from '~/components/ui/button';
import { ErrorList, Field } from '~/components/ui/forms';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const submission = parseWithZod(formData, { schema: EditFileNameSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await editFileName(supabase, {
    ...submission.value,
    fileId: params.fileId,
  });

  return success
    ? redirectWithSuccess(`/dashboard/${params.companyId}/file-library`, message)
    : dataWithError(null, message);
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const file = await fetchFileById(supabase, params.fileId);

  if (file === null)
    return redirectWithError(`/dashboard/${params.companyId}/file-library`, 'File  not exist');

  return data(file);
}

export default function EditFileName({ loaderData, actionData, params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const [form, fields] = useForm({
    id: 'edit-file-form',
    constraint: getZodConstraint(EditFileNameSchema),
    defaultValue: {
      name: loaderData.name,
    },
    lastResult: actionData?.result,
    shouldValidate: 'onInput',
    shouldRevalidate: 'onInput',
    onValidate: ({ formData }) => parseWithZod(formData, { schema: EditFileNameSchema }),
  });

  const isPending = useIsPending();

  const handleClose = () => navigate(`/dashboard/${params.companyId}/file-library`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header title='Edit file' />
        <Modal.Body>
          <Form method='POST' encType='multipart/form-data' {...getFormProps(form)}>
            <div className='relative flex justify-center pt-10 pb-2'>
              <div className='bg-card/80 rounded-lg p-4'>
                <FileNodeRenderer file={loaderData} />
              </div>
              <OutlineButton
                className='absolute -top-2 right-0'
                size='sm'
                type='button'
                onClick={() =>
                  navigate(
                    `/dashboard/${params.companyId}/file-library/${params.companyId}/edit/image`,
                  )
                }
              >
                <Pencil />
              </OutlineButton>
            </div>
            <Field
              labelProps={{ children: 'File Name', required: true }}
              inputProps={{
                ...getInputProps(fields.name, { type: 'text' }),
                autoFocus: true,
                disabled: isPending,
              }}
              errors={fields.name?.errors}
              description='Enter a name for your file.'
            />
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
