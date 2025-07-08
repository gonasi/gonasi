import { redirectWithError } from 'remix-toast';

import { fetchOrganizationCourseOverviewById } from '@gonasi/database/courses';

import type { Route } from './+types/overview-index';

import { BannerCard } from '~/components/cards/banner-card';
import {
  CourseCategoryOverview,
  CourseOverview as CourseInfoOverview,
  CourseThumbnail,
} from '~/components/course';
import { Separator } from '~/components/ui/separator';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [
    { title: 'Course Overview • Gonasi' },
    {
      name: 'description',
      content: 'Access overview and content structure for this course on Gonasi.',
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseId = params.courseId ?? '';

  const courseOverview = await fetchOrganizationCourseOverviewById({ supabase, courseId });

  if (!courseOverview) {
    return redirectWithError(`/${params.organizationId}/course-builder`, 'Course not found');
  }

  return courseOverview;
}

export default function CourseOverview({ loaderData, params }: Route.ComponentProps) {
  const {
    signedUrl,
    blur_hash,
    name,
    id: courseId,
    description,
    course_categories,
    course_sub_categories,

    updated_at,
  } = loaderData;

  return (
    <>
      <section>
        <div className='flex flex-col space-y-8'>
          <div className='flex flex-col space-y-4 space-x-0 md:flex-row md:space-y-0 md:space-x-8'>
            <div className='flex max-w-md items-center justify-center md:max-w-sm'>
              <CourseThumbnail
                thumbnail={signedUrl}
                blurHash={blur_hash}
                name={name}
                editLink={`/${params.username}/course-builder/${courseId}/overview/edit-thumbnail`}
              />
            </div>
            <div className='flex-1'>
              <CourseInfoOverview
                name={name}
                description={description}
                updatedAt={updated_at}
                editLink={`/${params.username}/course-builder/${courseId}/overview/edit-details`}
              />
            </div>
          </div>
          <Separator />
          <div className='flex flex-col space-y-4'>
            <BannerCard
              message='Provide additional context about your course by editing its category, sub-category, and learning pathway.'
              variant='info'
            />
            <div className='max-w-sm'>
              <CourseCategoryOverview
                category={course_categories?.name}
                subCategory={course_sub_categories?.name}
                editLink={`/${params.username}/course-builder/${courseId}/overview/grouping/edit-category`}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
