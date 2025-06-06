import { Form, useNavigate, useOutletContext, useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { editCourseDetails } from '@gonasi/database/courses';
import {
  EditCourseDetailsSchema,
  type EditCourseDetailsSchemaTypes,
} from '@gonasi/schemas/courses';

import type { Route } from './+types/edit-course-details';
import type { CourseOverviewType } from './course-by-id';

import { Button } from '~/components/ui/button';
import { GoInputField, GoTextAreaField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}
const resolver = zodResolver(EditCourseDetailsSchema);

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  // Initialize Supabase and headers for redirect
  const { supabase } = createClient(request);

  // Validate and parse form data with Zod
  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<EditCourseDetailsSchemaTypes>(formData, resolver);

  // Return validation errors, if any
  if (errors) {
    return { errors, defaultValues };
  }

  const { success, message } = await editCourseDetails(supabase, {
    ...data,
    courseId: params.courseId,
  });

  return success
    ? redirectWithSuccess(`/${params.username}/course/${params.courseId}/overview`, message)
    : dataWithError(null, message);
}

export default function EditCourseDetails() {
  const { name, description, monthly_subscription_price } =
    useOutletContext<CourseOverviewType>() ?? {};

  const courseDetailsDefaults = {
    name,
    description: description ?? '',
    monthlySubscriptionPrice: monthly_subscription_price ?? 0,
  };

  const isPending = useIsPending();
  const navigate = useNavigate();
  const params = useParams();

  // Initialize form methods with validation
  const methods = useRemixForm<EditCourseDetailsSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: { ...courseDetailsDefaults },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  const handleClose = () => navigate(`/${params.username}/course/${params.courseId}/overview`);

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header title='Edit Course Details' hasClose={false} closeRoute='/dashboard' />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />
              <GoInputField
                labelProps={{ children: 'Course Title', required: true }}
                name='name'
                inputProps={{
                  autoFocus: true,
                  disabled: isDisabled,
                }}
                description='Enter the course title.'
              />
              <GoTextAreaField
                labelProps={{ children: 'Course Description', required: true }}
                name='description'
                textareaProps={{
                  disabled: isDisabled,
                }}
                description='Provide a brief course description.'
              />
              <GoInputField
                prefix='KES'
                labelProps={{ children: 'Monthly Subscription Price', required: true }}
                name='monthlySubscriptionPrice'
                inputProps={{
                  disabled: isDisabled,
                  type: 'number',
                }}
                description='Specify the monthly subscription fee. 0 if course is free.'
              />
              <Button
                type='submit'
                disabled={isDisabled || !methods.formState.isDirty}
                isLoading={isDisabled}
                rightIcon={<Save />}
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
