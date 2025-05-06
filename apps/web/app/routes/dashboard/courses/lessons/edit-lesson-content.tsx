import { Outlet, useNavigate } from 'react-router';
import { parseWithZod } from '@conform-to/zod';
import { NotebookPen } from 'lucide-react';
import { dataWithError, dataWithSuccess, redirectWithError } from 'remix-toast';

import {
  editLessonContent,
  fetchLessonBlocksByLessonId,
  fetchUserLessonById,
} from '@gonasi/database/lessons';
import { SubmitEditLessonContentSchema } from '@gonasi/schemas/lessons';

import type { Route } from './+types/edit-lesson-content';

import { PluginButton } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

// Loader
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [lesson, lessonBlocks] = await Promise.all([
    fetchUserLessonById(supabase, params.lessonId),
    fetchLessonBlocksByLessonId(supabase, params.lessonId),
  ]);

  if (!lesson) {
    return redirectWithError(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content`,
      'Lesson not found',
    );
  }

  return { lesson, lessonBlocks };
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
  const { lesson, lessonBlocks } = loaderData;

  const navigate = useNavigate();

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/courses/${params.courseId}/course-content`);

  const handleOpenPluginModal = () =>
    navigate(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}/edit-content/plugins`,
    );

  const handleEditPlugin = (blockId: string) =>
    navigate(
      `/dashboard/${params.companyId}/courses/${params.courseId}/course-content/${params.chapterId}/${params.lessonId}/edit-content/${blockId}/edit`,
    );

  return (
    <>
      <Modal open onOpenChange={(open) => open || handleClose()}>
        <Modal.Content size='full'>
          <Modal.Header
            leadingIcon={<NotebookPen />}
            title={lesson.name}
            subTitle={lesson.lesson_types?.name}
          />
          {lessonBlocks.data?.map((block) => (
            <div key={block.id} className='border py-4'>
              <button onClick={() => handleEditPlugin(block.id)}>{block.plugin_type}</button>
            </div>
          ))}
          {/* Floating Button with shadcn Popover */}
          <PluginButton onClick={() => handleOpenPluginModal()} />
        </Modal.Content>
      </Modal>
      <Outlet />
    </>
  );
}
