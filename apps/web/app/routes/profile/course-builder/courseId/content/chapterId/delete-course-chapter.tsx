// External imports
import { Form, useNavigate, useParams } from 'react-router';
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

/**
 * Loader: Fetch chapter data for deletion view
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const chapter = await fetchUserCourseChapterById(supabase, params.chapterId);

  if (!chapter) {
    const redirectTo = `/${params.username}/course-builder/${params.courseId}/content`;
    return redirectWithError(redirectTo, 'Chapter path not exist');
  }

  return { chapter };
}

/**
 * Action: Handle form submission to delete chapter
 */
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

  const redirectTo = `/${params.username}/course-builder/${params.courseId}/content`;

  return result.success
    ? redirectWithSuccess(redirectTo, result.message)
    : dataWithError(null, result.message);
}

/**
 * Component: DeleteCourseChapter modal form
 */
export default function DeleteCourseChapter({ loaderData }: Route.ComponentProps) {
  const {
    chapter: { id, name },
  } = loaderData;
  const navigate = useNavigate();
  const params = useParams();
  const isPending = useIsPending();

  const closeRoute = `/${params.username}/course-builder/${params.courseId}/content`;

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
        <Modal.Header closeRoute={closeRoute} />
        <Modal.Body>
          <RemixFormProvider {...methods}>
            <Form method='POST' onSubmit={methods.handleSubmit}>
              <HoneypotInputs />

              <DeleteConfirmationLayout
                titlePrefix='course chapter: '
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
