import { Form, useNavigate, useOutletContext, useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { editCourseImage } from '@gonasi/database/courses';
import { EditCourseImageSchema, type EditCourseImageSchemaTypes } from '@gonasi/schemas/courses';

import type { Route } from './+types/edit-course-image';
import type { CourseOverviewType } from './course-by-id';

import { Button } from '~/components/ui/button';
import { GoFileField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Course Details - Gonasi' },
    { name: 'description', content: 'Explore detailed information about this course on Gonasi.' },
  ];
}

const resolver = zodResolver(EditCourseImageSchema);

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  // Validate and parse form data with Zod
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditCourseImageSchemaTypes>(formData, resolver);

  // Return validation errors, if any
  if (errors) {
    return { errors, defaultValues };
  }

  const { success, message } = await editCourseImage(supabase, {
    ...data,
    courseId: params.courseId,
  });

  return success
    ? redirectWithSuccess(`/${params.username}/course/${params.courseId}/overview`, message)
    : dataWithError(null, message);
}

export default function EditCourseImage() {
  const isPending = useIsPending();
  const navigate = useNavigate();
  const params = useParams();

  const { image_url } = useOutletContext<CourseOverviewType>();

  // Initialize form methods with validation
  const methods = useRemixForm<EditCourseImageSchemaTypes>({
    mode: 'all',
    resolver,
    submitData: { imageUrl: image_url },
  });

  const handleClose = () => navigate(`/${params.username}/course/${params.courseId}/overview`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header title='Edit Course Thumbnail' />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' encType='multipart/form-data' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />
              <GoFileField
                labelProps={{ children: 'Course image', required: true }}
                name='image'
                inputProps={{
                  disabled: isPending,
                }}
                description='Upload an image to visually represent your course'
              />

              <Button
                type='submit'
                disabled={isPending}
                isLoading={isPending || methods.formState.isSubmitting}
              >
                Save Changes
              </Button>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
