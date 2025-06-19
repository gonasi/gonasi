import { Form, useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { editCourseChapterById, fetchUserCourseChapterById } from '@gonasi/database/courseChapters';
import { fetchCoursePricing } from '@gonasi/database/courses';
import { EditChapterSchema, type EditChapterSchemaTypes } from '@gonasi/schemas/courseChapters';

import type { Route } from './+types/edit-course-chapter';

import { LockToggleIcon } from '~/components/icons';
import { Button } from '~/components/ui/button';
import { GoInputField, GoSwitchField, GoTextAreaField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

// Metadata for the page
export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

// Zod schema resolver
const resolver = zodResolver(EditChapterSchema);

// Loader: fetch chapter data
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [chapter, pricingData] = await Promise.all([
    fetchUserCourseChapterById(supabase, params.chapterId),
    fetchCoursePricing({ supabase, courseId: params.courseId }),
  ]);

  if (!chapter) {
    return redirectWithError(
      `/${params.username}/course-builder/${params.courseId}/content`,
      'Chapter path not exist',
    );
  }

  const isPaid = Array.isArray(pricingData)
    ? pricingData.some((item) => item.is_free === false)
    : false;

  return { chapter, isPaid };
}

// Action: handle form submission
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditChapterSchemaTypes>(formData, resolver);

  if (errors) return { errors, defaultValues };

  const { success, message } = await editCourseChapterById(supabase, {
    ...data,
    chapterId: params.chapterId,
  });

  return success
    ? redirectWithSuccess(`/${params.username}/course-builder/${params.courseId}/content`, message)
    : dataWithError(null, message);
}

// Component: Edit course chapter form
export default function EditCourseChapter({ loaderData }: Route.ComponentProps) {
  const params = useParams();
  const isPending = useIsPending();

  const {
    chapter: { name, description, requires_payment },
    isPaid,
  } = loaderData;

  const methods = useRemixForm<EditChapterSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      name,
      description: description ?? '',
      requiresPayment: requires_payment,
    },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  const watchRequiresPayment = methods.watch('requiresPayment');

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='Edit course chapter'
          closeRoute={`/${params.username}/course-builder/${params.courseId}/content`}
        />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              {/* Chapter title input */}
              <GoInputField
                labelProps={{ children: 'Chapter title', required: true }}
                name='name'
                inputProps={{ autoFocus: true, disabled: isDisabled }}
                description='Give your chapter a short, clear name.'
              />

              {/* Chapter description textarea */}
              <GoTextAreaField
                name='description'
                labelProps={{ children: 'What’s this chapter about?', required: true }}
                textareaProps={{ disabled: isDisabled }}
                description='Just a quick overview to help learners know what to expect.'
              />

              <GoSwitchField
                name='requiresPayment'
                disabled={!isPaid}
                labelProps={{
                  children: (
                    <p className='flex items-center space-x-1'>
                      <span>Paid chapter</span>
                      <LockToggleIcon lock={watchRequiresPayment} />
                    </p>
                  ),
                  required: false,
                }}
                description={
                  isPaid
                    ? 'Enable this to make the chapter available only to paying users.'
                    : 'This course is free, so all chapters are accessible. Set the course to paid to restrict chapter access.'
                }
              />

              {/* Submit button */}
              <Button
                type='submit'
                disabled={isDisabled || !methods.formState.isDirty}
                isLoading={isDisabled}
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
