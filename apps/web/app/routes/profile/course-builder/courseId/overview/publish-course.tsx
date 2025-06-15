import { zodResolver } from '@hookform/resolvers/zod';
import { dataWithError } from 'remix-toast';

import { fetchCourseChaptersByCourseId } from '@gonasi/database/courseChapters';
import { fetchCourseOverviewById, fetchCoursePricing } from '@gonasi/database/courses';
import { DeleteFileSchema } from '@gonasi/schemas/file';

import type { Route } from './+types/publish-course';

import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [
    { title: 'Publish Course - Gonasi' },
    {
      name: 'description',
      content:
        'Validate your course content and publish it on Gonasi. Ensure your course meets all requirements before going live.',
    },
  ];
}

const resolver = zodResolver(DeleteFileSchema);

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseId = params.courseId ?? '';

  const [courseOverview, pricingData, courseChapters] = await Promise.all([
    fetchCourseOverviewById(supabase, courseId),
    fetchCoursePricing({ supabase, courseId }),
    fetchCourseChaptersByCourseId(supabase, params.courseId),
  ]);

  if (!courseOverview) {
    return dataWithError(null, 'Could not load course overview');
  }

  if (!pricingData) {
    return dataWithError(null, 'Could not load pricing data');
  }

  if (!courseChapters) {
    return dataWithError(null, 'Could not load chapters and lessons');
  }

  return { courseOverview, pricingData, courseChapters };
}

export default function PublishCourse({ loaderData, params }: Route.ComponentProps) {
  const closeRoute = `/${params.username}/course-builder/${params.courseId}/overview`;

  console.log('loader data is: ', loaderData);

  return (
    <Modal open>
      <Modal.Content size='sm'>
        <Modal.Header closeRoute={closeRoute} />
        <Modal.Body>
          <h2>Publish course</h2>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
