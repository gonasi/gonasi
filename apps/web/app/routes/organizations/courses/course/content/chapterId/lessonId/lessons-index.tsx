import { Outlet } from 'react-router';
import { Plus } from 'lucide-react';
import { redirectWithError } from 'remix-toast';

import { fetchLessonsByChapter } from '@gonasi/database/lessons';

import type { Route } from './+types/lessons-index';

import { CourseLessons } from '~/components/course/course-lessons';
import { IconNavLink } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

type LoaderData = Awaited<ReturnType<typeof loader>>;

type LoaderObjectData = Exclude<LoaderData, Response>;

export type LoaderLessonType = LoaderObjectData['lessons'][number];

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [result, canEditResult] = await Promise.all([
    fetchLessonsByChapter({
      supabase,
      chapterId: params.chapterId,
      organizationId: params.organizationId,
    }),
    supabase.rpc('can_user_edit_course', {
      arg_course_id: params.courseId,
    }),
  ]);

  if (!result) {
    return redirectWithError(
      `/${params.organizationId}/courses/${params.courseId}/content`,
      'Lessons not found',
    );
  }

  return {
    lessons: result?.lessons,
    chapter: result?.chapter,
    canEdit: canEditResult.data ?? false,
  };
}

export default function ViewAllChapterLessonsModal({ params, loaderData }: Route.ComponentProps) {
  return (
    <>
      <Modal open>
        <Modal.Content size='lg'>
          <Modal.Header
            title={loaderData?.chapter.name}
            closeRoute={`/${params.organizationId}/courses/${params.courseId}/content`}
            settingsPopover={
              <IconNavLink
                to={`/${params.organizationId}/courses/${params.courseId}/content/${params.chapterId}/lessons/new-lesson-details`}
                icon={Plus}
                className='bg-secondary text-secondary-foreground rounded-sm border p-2'
              />
            }
          />
          <Modal.Body>
            <CourseLessons lessons={loaderData.lessons} canEdit={loaderData.canEdit} />
          </Modal.Body>
        </Modal.Content>
      </Modal>
      <Outlet />
    </>
  );
}
