import { Form, useFetcher } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { editCourseDetails, fetchOrganizationCourseOverviewById } from '@gonasi/database/courses';
import {
  EditCourseDetailsSchema,
  type EditCourseDetailsSchemaTypes,
} from '@gonasi/schemas/courses';

import type { Route } from './+types/edit-details';
import type { loader as subCategoryLoader } from '../../../../api/course-sub-categories';

import { Button } from '~/components/ui/button';
import { GoInputField, GoTextAreaField } from '~/components/ui/forms/elements';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

export function meta() {
  return [
    { title: 'Edit Course Details • Gonasi' },
    {
      name: 'description',
      content:
        'Update your course title, description, and other details to better reflect your content.',
    },
  ];
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

  const { success, message } = await editCourseDetails({ supabase, data });

  return success
    ? redirectWithSuccess(`/${params.organizationId}/builder/${params.courseId}/overview`, message)
    : dataWithError(null, message);
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseId = params.courseId ?? '';
  const orgId = params.organizationId;

  const [courseOverview, canEditRes] = await Promise.all([
    fetchOrganizationCourseOverviewById({ supabase, courseId }),

    supabase.rpc('can_user_edit_course', { arg_course_id: courseId }),
  ]);

  if (!courseOverview || !canEditRes.data) {
    throw redirectWithError(
      `/${orgId}/builder/${courseId}/overview`,
      'Course not found or no permissions',
    );
  }

  return {
    courseOverview,
  };
}

export default function EditCourseGrouping({ params, loaderData }: Route.ComponentProps) {
  const {
    courseOverview: { name, description },
  } = loaderData;
  const fetcher = useFetcher<typeof subCategoryLoader>();

  const form = useRemixForm<EditCourseDetailsSchemaTypes>({
    mode: 'all',
    resolver: zodResolver(EditCourseDetailsSchema),
    defaultValues: {
      organizationId: params.organizationId,
      courseId: params.courseId,
      name,
      description: description ?? '',
    },
  });

  const isPending = useIsPending();
  const isDisabled = isPending || form.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          title='Edit Course Details'
          closeRoute={`/${params.organizationId}/builder/${params.courseId}/overview`}
        />
        <Modal.Body>
          <RemixFormProvider {...form}>
            <Form method='POST' onSubmit={form.handleSubmit}>
              <HoneypotInputs />

              <GoInputField
                labelProps={{ children: 'Course title', required: true }}
                name='name'
                inputProps={{
                  autoFocus: true,
                  disabled: isDisabled,
                }}
                description='Enter the course title.'
              />
              <GoTextAreaField
                labelProps={{ children: 'Course description', required: true }}
                name='description'
                textareaProps={{
                  disabled: isDisabled,
                }}
                description='Provide a brief course description.'
              />
              <Button
                type='submit'
                disabled={isDisabled || fetcher.state !== 'idle' || !form.formState.isDirty}
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
