import { data, Form, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { deleteFile, fetchFileById } from '@gonasi/database/files';
import { DeleteFileSchema, type DeleteFileSchemaTypes } from '@gonasi/schemas/file';

import type { Route } from './+types/delete-file';

import { DeleteConfirmationLayout } from '~/components/layouts/modals';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}
const resolver = zodResolver(DeleteFileSchema);

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [file, canEdit] = await Promise.all([
    fetchFileById(supabase, params.fileId),
    supabase.rpc('can_user_edit_course', {
      arg_course_id: params.courseId,
    }),
  ]);

  if (!canEdit.data) {
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/file-library`,
      'You are not authorized to delete this file',
    );
  }

  if (file === null)
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/file-library`,
      'File does not exist',
    );

  return data({
    fileId: file.id,
    name: file.name,
    path: file.path,
  });
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<DeleteFileSchemaTypes>(formData, resolver);

  // If validation failed, return errors and default values
  if (errors) {
    return { errors, defaultValues };
  }

  const { success, message } = await deleteFile(supabase, {
    ...data,
  });

  return success
    ? redirectWithSuccess(
        `/${params.organizationId}/builder/${params.courseId}/file-library`,
        message,
      )
    : dataWithError(null, message);
}

export default function DeleteFile({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const methods = useRemixForm<DeleteFileSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      name: loaderData.name,
      fileId: loaderData.fileId,
      path: loaderData.path,
    },
  });

  const isPending = useIsPending();

  const isDisabled = isPending || methods.formState.isSubmitting;

  const closeRoute = `/${params.organizationId}/builder/${params.courseId}/file-library`;

  const handleClose = () => navigate(closeRoute);

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header closeRoute={closeRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />
              <p className='py-2 text-center text-sm'>
                Blocks using this file will show a default placeholder until a file is uploaded.
              </p>

              <DeleteConfirmationLayout
                titlePrefix='file'
                title={loaderData.name}
                isLoading={isDisabled}
                handleClose={handleClose}
              />
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
