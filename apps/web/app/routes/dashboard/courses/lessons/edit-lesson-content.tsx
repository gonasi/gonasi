import { useNavigate } from 'react-router';
import { parseWithZod } from '@conform-to/zod';
import { NotebookPen } from 'lucide-react';
import { dataWithError, dataWithSuccess, redirectWithError } from 'remix-toast';

import { editLessonContent, fetchUserLessonById } from '@gonasi/database/lessons';
import { SubmitEditLessonContentSchema } from '@gonasi/schemas/lessons';

import type { Route } from './+types/edit-lesson-content';

import { BannerCard } from '~/components/cards';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

// Loader
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const lesson = await fetchUserLessonById(supabase, params.lessonId);

  if (!lesson) {
    return redirectWithError(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content`,
      'Course not found',
    );
  }

  return lesson;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const { supabase } = createClient(request);

  const submission = parseWithZod(formData, { schema: SubmitEditLessonContentSchema });

  if (submission.status !== 'success') {
    return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 };
  }

  const { success, message } = await editLessonContent(supabase, {
    ...submission.value,
  });

  if (!success) {
    return dataWithError(null, message);
  }

  return dataWithSuccess({ result: 'Data saved successfully' }, message);
}

// Component
export default function NewLessonTitle({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/courses/${params.courseId}/course-content`);

  return (
    <>
      <Modal open onOpenChange={(open) => open || handleClose()}>
        <Modal.Content size='full'>
          <Modal.Header
            leadingIcon={<NotebookPen />}
            title={loaderData.name}
            subTitle={loaderData.lesson_types?.name}
          />

          <BannerCard
            message='Editing this lesson will reset progress for all users.'
            variant='warning'
          />
          <h2>hey</h2>
        </Modal.Content>
      </Modal>
    </>
  );
}
