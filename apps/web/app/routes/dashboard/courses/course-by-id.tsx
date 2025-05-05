import { data, Outlet } from 'react-router';
import { redirectWithError } from 'remix-toast';

import { fetchCourseDetailsById } from '@gonasi/database/courses';

import type { Route } from './+types/course-by-id';

import { GoTabNav } from '~/components/go-tab-nav/course-tab-nav';
import { PlainLayout } from '~/components/layouts/plain';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [
    { title: 'Course Details - Gonasi' },
    { name: 'description', content: 'Explore detailed information about this course on Gonasi.' },
  ];
}

export type CourseDetailsType = Exclude<Awaited<ReturnType<typeof loader>>, Response>['data'];

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const courseDetails = await fetchCourseDetailsById(supabase, params.courseId ?? '');

  if (!courseDetails) {
    return redirectWithError(`/dashboard/${params.companyId}/courses`, 'Course not found');
  }

  return data(courseDetails);
}

export default function CourseById({ loaderData, params }: Route.ComponentProps) {
  const { id: courseId, name } = loaderData;

  return (
    <>
      <PlainLayout
        border={false}
        backLink={`/dashboard/${params.companyId}/courses`}
        title={name}
        navigation={
          <GoTabNav
            tabs={[
              {
                to: `/dashboard/${params.companyId}/courses/${courseId}/course-details`,
                name: 'Course Details',
              },
              {
                to: `/dashboard/${params.companyId}/courses/${courseId}/course-content`,
                name: 'Course Content',
              },
            ]}
          />
        }
      >
        <Outlet context={loaderData} />
      </PlainLayout>
    </>
  );
}
