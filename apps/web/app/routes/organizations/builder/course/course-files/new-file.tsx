import { data, Form } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';

import { NewFileLibrarySchema, type NewFileSchemaTypes } from '@gonasi/schemas/file';

import type { Route } from './+types/new-file';
import { newCourseFile } from '../../../../../../../../node_modules/@gonasi/database/src/courseFiles/newCourseFile';

import { Button } from '~/components/ui/button';
import { GoFileField, GoInputField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(NewFileLibrarySchema);

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const canEdit = await supabase.rpc('can_user_edit_course', {
    arg_course_id: params.courseId,
  });

  if (!canEdit.data) {
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/course-files`,
      'You are not authorized to create a new file',
    );
  }

  return data(true);
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<NewFileSchemaTypes>(formData, resolver);

  // If validation failed, return errors and default values
  if (errors) {
    return { errors, defaultValues };
  }

  const { success, message } = await newCourseFile(supabase, {
    ...data,
    courseId: params.courseId,
    organizationId: params.organizationId,
  });

  return success
    ? redirectWithSuccess(
        `/${params.organizationId}/builder/${params.courseId}/course-files`,
        message,
      )
    : dataWithError(null, message);
}

export default function NewFile({ params }: Route.ComponentProps) {
  const isPending = useIsPending();

  const methods = useRemixForm<NewFileSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      courseId: params.courseId,
      organizationId: params.organizationId,
    },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='Course File Upload'
          closeRoute={`/${params.organizationId}/builder/${params.courseId}/course-files`}
        />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' encType='multipart/form-data' onSubmit={methods.handleSubmit}>
              <GoFileField
                name='file'
                labelProps={{ children: 'Upload file', required: true }}
                inputProps={{
                  disabled: isDisabled,
                }}
                description='Choose a file to upload.'
              />
              <GoInputField
                labelProps={{ children: 'File name', required: true }}
                inputProps={{
                  disabled: isDisabled,
                }}
                name='name'
                description='Enter a name for your file.'
              />
              <Button type='submit' disabled={isDisabled} isLoading={isDisabled}>
                Save
              </Button>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
