import { data, Outlet } from 'react-router';
import { ChartNoAxesGantt, TableOfContents } from 'lucide-react';
import { redirectWithError } from 'remix-toast';

import { fetchCourseOverviewById } from '@gonasi/database/courses';

import type { Route } from './+types/course-by-id';

import { GoTabNav } from '~/components/go-tab-nav/course-tab-nav';
import { PlainLayout } from '~/components/layouts/plain';
import { createClient } from '~/lib/supabase/supabase.server';

/**
 * SEO metadata for the Course Overview page
 */
export function meta() {
  return [
    { title: 'Course Overview | Gonasi' },
    {
      name: 'description',
      content: 'Access overview and content structure for this course on Gonasi.',
    },
  ];
}

// Useful type for child components consuming Outlet context
export type CourseOverviewType = Exclude<Awaited<ReturnType<typeof loader>>, Response>['data'];

/**
 * Loader function to fetch course overview by ID.
 * If not found, redirects to the company page with an error toast.
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseId = params.courseId ?? '';

  const courseOverview = await fetchCourseOverviewById(supabase, courseId);

  if (!courseOverview) {
    return redirectWithError(`/${params.companyId}`, 'Course not found');
  }

  return data(courseOverview);
}

/**
 * Main Course page layout that wraps course detail tabs.
 */
export default function CourseById({ loaderData, params }: Route.ComponentProps) {
  const { id: courseId, name: courseName } = loaderData;

  return (
    <PlainLayout
      border={false}
      backLink={`/${params.username}`}
      title={courseName}
      navigation={
        <GoTabNav
          tabs={[
            {
              to: `/${params.username}/course/${courseId}/overview`,
              name: 'Overview',
              icon: ChartNoAxesGantt,
            },
            {
              to: `/${params.username}/course/${courseId}/content`,
              name: 'Content',
              icon: TableOfContents,
            },
          ]}
        />
      }
    >
      {/* The nested routes (overview/content) will be rendered here */}
      <Outlet context={loaderData} />
    </PlainLayout>
  );
}
