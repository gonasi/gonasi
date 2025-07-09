import { data, Form, useNavigate, useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { deleteUserLessonById, fetchUserLessonById } from '@gonasi/database/lessons';
import { DeleteLessonSchema, type DeleteLessonSchemaTypes } from '@gonasi/schemas/lessons';

import type { Route } from './+types/delete-lesson';

import { DeleteConfirmationLayout } from '~/components/layouts/modals';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(DeleteLessonSchema);

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [lesson, canDelete] = await Promise.all([
    fetchUserLessonById(supabase, params.lessonId),
    supabase.rpc('can_user_edit_course', {
      arg_course_id: params.courseId,
    }),
  ]);

  if (!canDelete) {
    throw redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/content/chapter`,
      'You don’t have permission to delete this lesson.',
    );
  }

  if (lesson === null)
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/content`,
      'Learning path not exist',
    );

  return data(lesson);
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<DeleteLessonSchemaTypes>(formData, resolver);

  if (errors) return { errors, defaultValues };

  const { success, message } = await deleteUserLessonById(supabase, {
    ...data,
  });

  if (!success) {
    return dataWithError(null, message);
  }

  return redirectWithSuccess(
    `/${params.organizationId}/builder/${params.courseId}/content`,
    message,
  );
}

export default function DeleteLesson({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const params = useParams();

  const handleClose = () =>
    navigate(`/${params.username}/course-builder/${params.courseId}/content`);

  const isPending = useIsPending();

  const methods = useRemixForm<DeleteLessonSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      lessonId: loaderData.id,
    },
  });

  const isDisabled = isPending || methods.formState.isSubmitting;

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header
          closeRoute={`/${params.username}/course-builder/${params.courseId}/content`}
        />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <DeleteConfirmationLayout
                titlePrefix='lesson: '
                title={loaderData.name}
                isLoading={isDisabled}
                handleClose={handleClose}
              />
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
