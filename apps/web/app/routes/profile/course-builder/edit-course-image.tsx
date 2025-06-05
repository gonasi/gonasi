import { useEffect, useState } from 'react';
import { Form, useOutletContext, useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { LoaderCircle } from 'lucide-react';
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

const resolver = zodResolver(EditCourseImageSchema);

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditCourseImageSchemaTypes>(formData, resolver);

  if (errors) {
    return { errors, defaultValues };
  }

  try {
    if (!(data.image instanceof File)) {
      return dataWithError(null, 'Oops! That doesn’t look like a valid image.');
    }

    const blurHash = await generateBlurHash(data.image);

    const { success, message } = await editCourseImage(supabase, {
      ...data,
      courseId: params.courseId,
      blurHash,
    });

    return success
      ? redirectWithSuccess(
          `/${params.username}/course-builder/${params.courseId}/overview`,
          message,
        )
      : dataWithError(null, message);
  } catch (error) {
    console.error('Image processing error:', error);

    const { success, message } = await editCourseImage(supabase, {
      ...data,
      courseId: params.courseId,
      blurHash: null,
    });

    return success
      ? redirectWithSuccess(
          `/${params.username}/course-builder/${params.courseId}/overview`,
          message,
        )
      : dataWithError(null, 'Image saved but preview failed to generate.');
  }
}

export default function EditCourseImage() {
  const isPending = useIsPending();
  const params = useParams();
  const { image_url } = useOutletContext<CourseOverviewType>();

  const methods = useRemixForm<EditCourseImageSchemaTypes>({
    mode: 'all',
    resolver,
    submitData: { imageUrl: image_url },
  });

  const isSubmitting = isPending || methods.formState.isSubmitting;
  const [showLoadingText, setShowLoadingText] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isSubmitting) {
      timer = setTimeout(() => setShowLoadingText(true), 2000);
    } else {
      setShowLoadingText(false);
    }

    return () => clearTimeout(timer);
  }, [isSubmitting]);

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='🖼️ Update Course Thumbnail'
          closeRoute={`/${params.username}/course-builder/${params.courseId}/overview`}
        />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' encType='multipart/form-data' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <GoFileField
                labelProps={{ children: 'Course Image', required: true }}
                name='image'
                inputProps={{ disabled: isSubmitting }}
                description='Upload a fresh new look for your course ✨'
              />

              <AnimatePresence>
                {showLoadingText && (
                  <motion.div
                    key='loading-text'
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.25 }}
                    className='flex items-center space-x-2 pb-2'
                  >
                    <LoaderCircle size={10} className='animate-spin' />
                    <p className='font-secondary text-xs'>Generating optimized image…</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button type='submit' disabled={isPending} isLoading={isSubmitting}>
                Save
              </Button>
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
