import { data, Outlet } from 'react-router';
import { Plus } from 'lucide-react';
import { dataWithError } from 'remix-toast';

import {
  fetchCourseChaptersByCourseId,
  updateChapterPositions,
} from '@gonasi/database/courseChapters';
import { updateLessonPositions } from '@gonasi/database/lessons';
import { ChapterPositionUpdateArraySchema } from '@gonasi/schemas/courseChapters';
import { LessonPositionUpdateArraySchema } from '@gonasi/schemas/lessons';

import type { Route } from './+types/content-index';

import { BannerCard } from '~/components/cards';
import { CourseChapters } from '~/components/course/course-chapters';
import { FloatingActionButton } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [
    { title: 'Course Content • Gonasi' },
    {
      name: 'description',
      content:
        'Structure your course content with ease. View and organize chapters and lessons in one place—perfect for keeping your curriculum clear and student-friendly.',
    },
  ];
}

// Types for chapter and lesson data, inferred from the loader
export type CourseContentLoaderData = Exclude<Awaited<ReturnType<typeof loader>>, Response>['data'];

export type CourseChapter = NonNullable<CourseContentLoaderData>['chapters'][number];
export type CourseLessonType = NonNullable<CourseChapter>['lessons'][number];

// Loads all chapters (with their lessons) for a given course
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const [courseChaptersResult, canEditResult] = await Promise.all([
    fetchCourseChaptersByCourseId(supabase, params.courseId),
    supabase.rpc('can_user_edit_course', {
      arg_course_id: params.courseId,
    }),
  ]);

  return data({
    chapters: courseChaptersResult ?? [],
    canEdit: canEditResult.data ?? false,
  });
}

// Handles form submissions for reordering chapters or lessons
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const { supabase } = createClient(request);
  const intent = formData.get('intent');

  if (intent === 'reorder-chapters') {
    const chaptersRaw = formData.get('chapters');

    if (typeof chaptersRaw !== 'string') {
      throw new Response('Invalid data', { status: 400 });
    }

    const parsedChapters = ChapterPositionUpdateArraySchema.safeParse(JSON.parse(chaptersRaw));

    if (!parsedChapters.success) {
      console.error(parsedChapters.error);
      throw new Response('Validation failed', { status: 400 });
    }

    const result = await updateChapterPositions({
      supabase,
      courseId: params.courseId,
      chapterPositions: parsedChapters.data,
    });

    return result.success
      ? data({ success: true })
      : dataWithError(null, result.message ?? 'Could not re-order chapters');
  }

  // Handle reordering lessons
  if (intent === 'reorder-lessons') {
    const lessonsRaw = formData.get('lessons');
    const chapterId = formData.get('chapterId');

    if (typeof lessonsRaw !== 'string' || typeof chapterId !== 'string') {
      throw new Response('Invalid data', { status: 400 });
    }

    const parsed = LessonPositionUpdateArraySchema.safeParse(JSON.parse(lessonsRaw));

    if (!parsed.success) {
      console.error(parsed.error);
      throw new Response('Validation failed', { status: 400 });
    }

    const { success, message } = await updateLessonPositions({
      supabase,
      chapterId: chapterId ?? '',
      lessonPositions: parsed.data,
    });

    if (!success) {
      return dataWithError(null, message ?? 'Could not re-order lessons');
    }

    return data({ success: true });
  }

  // If no matching intent is found
  throw new Response('Unknown intent', { status: 400 });
}

export default function CourseOverview({ loaderData, params }: Route.ComponentProps) {
  const { chapters, canEdit } = loaderData;

  return (
    <>
      <div className='max-w-2xl pb-20'>
        {canEdit ? (
          <BannerCard
            message='Want to reorder your chapters and lessons? Just drag and drop.'
            variant='tip'
            className='mb-10'
          />
        ) : null}

        <CourseChapters chapters={chapters} canEdit={canEdit} />
      </div>

      {canEdit ? (
        <FloatingActionButton
          to={`/${params.organizationId}/builder/${params.courseId}/content/chapter/new`}
          tooltip='Add new chapter'
          icon={<Plus size={20} strokeWidth={4} />}
        />
      ) : null}

      <Outlet />
    </>
  );
}
