import { data, Link, Outlet } from 'react-router';
import { Plus } from 'lucide-react';
import { dataWithError } from 'remix-toast';

import {
  fetchCourseChaptersByCourseId,
  updateChapterPositions,
} from '@gonasi/database/courseChapters';
import { updateLessonPositions } from '@gonasi/database/lessons';
import { ChapterPositionUpdateArraySchema } from '@gonasi/schemas/courseChapters';
import { LessonPositionUpdateArraySchema } from '@gonasi/schemas/lessons';

import type { Route } from '../content/+types';

import { BannerCard } from '~/components/cards';
import { CourseChapters } from '~/components/course/course-chapters';
import { buttonVariants } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';

export type CourseChaptersType = Exclude<Awaited<ReturnType<typeof loader>>, Response>['data'];
export type CourseLessonType = NonNullable<CourseChaptersType>[number]['lessons'][number];

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseChapters = await fetchCourseChaptersByCourseId(supabase, params.courseId);
  return data(courseChapters);
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const { supabase } = createClient(request);

  const intent = formData.get('intent');

  if (intent === 'reorder-chapters') {
    const chaptersRaw = formData.get('chapters');

    if (typeof chaptersRaw !== 'string') {
      throw new Response('Invalid data', { status: 400 });
    }

    const parsed = ChapterPositionUpdateArraySchema.safeParse(JSON.parse(chaptersRaw));

    if (!parsed.success) {
      console.error(parsed.error);
      throw new Response('Validation failed', { status: 400 });
    }

    const { success, message } = await updateChapterPositions(supabase, parsed.data);

    if (!success) {
      return dataWithError(null, message ?? 'Could not re-order chapters');
    }

    return data({ success: true });
  }

  if (intent === 'reorder-lessons') {
    const lessonsRaw = formData.get('lessons');

    if (typeof lessonsRaw !== 'string') {
      throw new Response('Invalid data', { status: 400 });
    }

    const parsed = LessonPositionUpdateArraySchema.safeParse(JSON.parse(lessonsRaw));

    if (!parsed.success) {
      console.error(parsed.error);
      throw new Response('Validation failed', { status: 400 });
    }

    const { success, message } = await updateLessonPositions(supabase, parsed.data);

    if (!success) {
      return dataWithError(null, message ?? 'Could not re-order lessons');
    }

    return data({ success: true });
  }

  throw new Response('Unknown intent', { status: 400 });
}

export default function CourseOverview({ loaderData, params }: Route.ComponentProps) {
  return (
    <>
      <div className='max-w-xl pb-20'>
        <BannerCard
          message='Just drag and drop to sort your chapters and lessons. Easy peasy.'
          variant='tip'
          className='mb-10'
        />
        <div className='flex justify-end pb-8'>
          <Link
            to={`/dashboard/${params.companyId}/courses/${params.courseId}/course-content/chapter/new`}
            className={buttonVariants({ variant: 'default', size: 'sm' })}
          >
            <Plus className='mr-2 h-4 w-4' />
            Add a chapter
          </Link>
        </div>
        <CourseChapters
          companyId={params.companyId}
          chapters={loaderData}
          courseId={params.courseId}
        />
      </div>
      <Outlet />
    </>
  );
}
