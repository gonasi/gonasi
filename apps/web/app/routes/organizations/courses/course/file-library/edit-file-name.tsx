import { data, Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';

import { editFileName, fetchFileById } from '@gonasi/database/files';
import { EditFileNameSchema, type EditFileNameSchemaTypes } from '@gonasi/schemas/file';

import type { Route } from './+types/edit-file-name';

import FileNodeRenderer from '~/components/file-renderers/file-node-renderer';
import { Button, IconNavLink } from '~/components/ui/button';
import { GoInputField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(EditFileNameSchema);

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditFileNameSchemaTypes>(formData, resolver);

  // If validation failed, return errors and default values
  if (errors) {
    return { errors, defaultValues };
  }

  const { success, message } = await editFileName(supabase, {
    ...data,
  });

  return success
    ? redirectWithSuccess(
        `/${params.organizationId}/courses/${params.courseId}/file-library`,
        message,
      )
    : dataWithError(null, message);
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [file, canEdit] = await Promise.all([
    fetchFileById({ supabase, fileId: params.fileId, mode: 'preview' }),
    supabase.rpc('can_user_edit_course', {
      arg_course_id: params.courseId,
    }),
  ]);

  if (!canEdit.data) {
    return redirectWithError(
      `/${params.organizationId}/courses/${params.courseId}/file-library`,
      'You are not authorized to edit this file',
    );
  }

  if (file.data === null)
    return redirectWithError(
      `/${params.organizationId}/courses/${params.courseId}/file-library`,
      'File does not exist',
    );

  return data(file.data);
}

export default function EditFileName({ loaderData, params }: Route.ComponentProps) {
  const methods = useRemixForm<EditFileNameSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      name: loaderData.name,
      fileId: loaderData.id,
    },
  });

  const isPending = useIsPending();

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='Edit File'
          closeRoute={`/${params.organizationId}/courses/${params.courseId}/file-library`}
        />
        <Modal.Body>
          <div className='relative pt-10 pb-2'>
            <div className='bg-card/50 relative flex h-40 w-full items-center justify-center md:h-60'>
              <FileNodeRenderer file={loaderData} />

              <IconNavLink
                to={`/${params.organizationId}/courses/${params.courseId}/file-library/${params.fileId}/edit/image`}
                icon={Pencil}
                className='bg-background/90 hover:bg-background absolute top-3 right-3 rounded-full p-2 shadow backdrop-blur transition'
              />
            </div>
          </div>

          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <GoInputField
                labelProps={{ children: 'File name', required: true }}
                inputProps={{
                  disabled: isDisabled,
                }}
                name='name'
                description='Enter a name for your file.'
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
