// 🧠 Core Remix + React Hooks
import { Form, useNavigate, useOutletContext, useParams } from 'react-router';
// 🛠 Form validation and handling
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
// 🍞 Toast helpers
import { dataWithError, redirectWithSuccess } from 'remix-toast';
// 🕵️‍♀️ Honeypot spam protection
import { HoneypotInputs } from 'remix-utils/honeypot/react';

// � Business logic
import { editCourseImage } from '@gonasi/database/courses';
import { EditCourseImageSchema, type EditCourseImageSchemaTypes } from '@gonasi/schemas/courses';

// 🧩 Types
import type { Route } from './+types/edit-course-image';
import type { CourseOverviewType } from './course-by-id';

// �🧱 UI Components
import { Button } from '~/components/ui/button';
import { GoFileField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
// 📦 Server utils & services
import { createClient } from '~/lib/supabase/supabase.server';
import { generateBlurHash } from '~/utils/generate-blur-hash.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Edit Course Thumbnail - Gonasi' },
    {
      name: 'description',
      content: 'Give your course a fresh new look by updating its thumbnail!',
    },
  ];
}

// Zod resolver for form validation
const resolver = zodResolver(EditCourseImageSchema);

// 🔁 Form submission logic
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  // Validate form data using Zod schema
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditCourseImageSchemaTypes>(formData, resolver);

  if (errors) {
    // Return validation errors to the form
    return { errors, defaultValues };
  }

  try {
    // Check file validity
    if (!(data.image instanceof File)) {
      return dataWithError(null, 'Oops! That doesn’t look like a valid image.');
    }

    // Generate blur hash for a nice preview effect
    const blurHash = await generateBlurHash(data.image);

    const { success, message } = await editCourseImage(supabase, {
      ...data,
      courseId: params.courseId,
      blurHash,
    });

    return success
      ? redirectWithSuccess(`/${params.username}/course/${params.courseId}/overview`, message)
      : dataWithError(null, message);
  } catch (error) {
    console.error('Image processing error:', error);

    // Gracefully handle error if blur hash fails
    const { success, message } = await editCourseImage(supabase, {
      ...data,
      courseId: params.courseId,
      blurHash: null, // fallback: skip blur hash
    });

    return success
      ? redirectWithSuccess(`/${params.username}/course/${params.courseId}/overview`, message)
      : dataWithError(null, 'Image saved but preview failed to generate.');
  }
}

// 🎨 UI for editing course image
export default function EditCourseImage() {
  const isPending = useIsPending();
  const navigate = useNavigate();
  const params = useParams();
  const { image_url } = useOutletContext<CourseOverviewType>();

  const methods = useRemixForm<EditCourseImageSchemaTypes>({
    mode: 'all',
    resolver,
    submitData: { imageUrl: image_url },
  });

  const handleClose = () => navigate(`/${params.username}/course/${params.courseId}/overview`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header title='🖼️ Update Course Thumbnail' />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' encType='multipart/form-data' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />
              <GoFileField
                labelProps={{ children: 'Course Image', required: true }}
                name='image'
                inputProps={{ disabled: isPending }}
                description='Upload a fresh new look for your course ✨'
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
