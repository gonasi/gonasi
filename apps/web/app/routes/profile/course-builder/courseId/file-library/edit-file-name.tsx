import { data, Form, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';

import { editFileName, fetchFileById } from '@gonasi/database/files';
import { EditFileNameSchema, type EditFileNameSchemaTypes } from '@gonasi/schemas/file';

import type { Route } from './+types/edit-file-name';

import FileNodeRenderer from '~/components/file-renderers/file-node-renderer';
import { Button } from '~/components/ui/button';
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
        `/${params.username}/course-builder/${params.courseId}/file-library`,
        message,
      )
    : dataWithError(null, message);
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const file = await fetchFileById(supabase, params.fileId);

  if (file === null)
    return redirectWithError(
      `/${params.username}/course-builder/${params.courseId}/file-library`,
      'File does not exist',
    );

  return data(file);
}

export default function EditFileName({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();

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
          closeRoute={`/${params.username}/course-builder/${params.courseId}/file-library`}
        />
        <Modal.Body>
          <div className='relative flex justify-center pt-10 pb-2'>
            <div className='bg-card/50 flex h-40 w-full items-center justify-center md:h-60'>
              <FileNodeRenderer file={loaderData} />
            </div>
            <Button
              className='absolute top-14 right-4'
              size='sm'
              variant='secondary'
              type='button'
              onClick={() =>
                navigate(
                  `/${params.username}/course-builder/${params.courseId}/file-library/${params.fileId}/edit/image`,
                )
              }
            >
              <Pencil />
            </Button>
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
