import { Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { editFile, fetchFileById } from '@gonasi/database/files';
import { EditFileSchema, type EditFileSchemaTypes } from '@gonasi/schemas/file';

import type { Route } from './+types/edit-file-image';

import { Button } from '~/components/ui/button';
import { GoFileField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(EditFileSchema);

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [file, canEdit] = await Promise.all([
    fetchFileById({ supabase, fileId: params.fileId }),
    supabase.rpc('can_user_edit_course', {
      arg_course_id: params.courseId,
    }),
  ]);

  if (!canEdit.data) {
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/file-library`,
      'You are not authorized to edit this file',
    );
  }

  if (file === null) {
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/file-library`,
      'File does not exist',
    );
  }

  return file;
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditFileSchemaTypes>(formData, resolver);

  // If validation failed, return errors and default values
  if (errors) {
    return { errors, defaultValues };
  }
  const { success, message } = await editFile(supabase, {
    ...data,
  });

  return success
    ? redirectWithSuccess(
        `/${params.organizationId}/builder/${params.courseId}/file-library/${params.fileId}/edit`,
        message,
      )
    : dataWithError(null, message);
}

export default function EditFileImage({ loaderData, params }: Route.ComponentProps) {
  const methods = useRemixForm<EditFileSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      path: loaderData.path,
      fileId: loaderData.id,
      organizationId: loaderData.organization_id,
    },
  });

  const isPending = useIsPending();

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='Update File'
          closeRoute={`/${params.organizationId}/builder/${params.courseId}/file-library/${params.fileId}/edit`}
        />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' encType='multipart/form-data' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />
              <GoFileField
                name='file'
                labelProps={{ children: 'Upload file', required: true }}
                inputProps={{
                  disabled: isDisabled,
                }}
                description='Upload a new file to replace the current one.'
              />
              <Button
                type='submit'
                disabled={isPending || !methods.formState.isDirty}
                isLoading={isPending}
              >
                Save
              </Button>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
