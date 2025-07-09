import { Form, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { getValidatedFormData, RemixFormProvider, useRemixForm } from 'remix-hook-form';
import { dataWithError, redirectWithError, redirectWithSuccess } from 'remix-toast';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

// Internal imports: DB + schema
import { deleteUserChapterById, fetchUserCourseChapterById } from '@gonasi/database/courseChapters';
import { DeleteChapterSchema, type DeleteChapterSchemaTypes } from '@gonasi/schemas/courseChapters';

import type { Route } from './+types/delete-course-chapter';

// UI components
import { DeleteConfirmationLayout } from '~/components/layouts/modals';
import { Modal } from '~/components/ui/modal';
// Server utils
import { createClient } from '~/lib/supabase/supabase.server';
import { checkHoneypot } from '~/utils/honeypot.server';
import { useIsPending } from '~/utils/misc';

const resolver = zodResolver(DeleteChapterSchema);

// Loader: Fetch chapter and permission for deletion
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [chapter, canDelete] = await Promise.all([
    fetchUserCourseChapterById(supabase, params.chapterId),
    supabase.rpc('can_user_edit_course', {
      arg_course_id: params.courseId,
    }),
  ]);

  if (!canDelete) {
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/content`,
      'You don’t have permission to edit this course.',
    );
  }

  if (!chapter) {
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/content`,
      'The chapter you’re trying to delete no longer exists.',
    );
  }

  return { chapter };
}

// Action: Handle chapter deletion
export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  await checkHoneypot(formData);

  const { supabase } = createClient(request);

  const {
    errors,
    data,
    receivedValues: defaultValues,
  } = await getValidatedFormData<DeleteChapterSchemaTypes>(formData, resolver);

  if (errors) return { errors, defaultValues };

  const result = await deleteUserChapterById(supabase, data);
  const redirectTo = `/${params.organizationId}/builder/${params.courseId}/content`;

  return result.success
    ? redirectWithSuccess(redirectTo, result.message)
    : dataWithError(null, result.message);
}

// UI: Delete confirmation modal
export default function DeleteCourseChapter({ loaderData, params }: Route.ComponentProps) {
  const {
    chapter: { id, name },
  } = loaderData;

  const navigate = useNavigate();
  const isPending = useIsPending();

  const closeRoute = `/${params.organizationId}/builder/${params.courseId}/content`;

  const methods = useRemixForm<DeleteChapterSchemaTypes>({
    mode: 'all',
    resolver,
    defaultValues: {
      chapterId: id,
    },
  });

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header title='Delete Chapter' closeRoute={closeRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <DeleteConfirmationLayout
                titlePrefix='Are you sure you want to delete the chapter:'
                title={name}
                isLoading={isPending}
                handleClose={() => navigate(closeRoute)}
              />
            </Form>
          </RemixFormProvider>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
