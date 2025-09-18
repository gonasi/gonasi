import { Outlet } from 'react-router';
import { motion } from 'framer-motion';

import { fetchPublishedCourseDetails } from '@gonasi/database/courses';

import type { Route } from './+types/published-overview-index';

import { BannerCard } from '~/components/cards';
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

  const publishedCourse = await fetchPublishedCourseDetails({
    supabase,
    publishedCourseId: params.courseId,
  });

  return publishedCourse;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 2 },
  visible: { opacity: 1, y: 0 },
};

export default function CourseOverview({ loaderData, params }: Route.ComponentProps) {
  return (
    <>
      <section>
        <motion.div
          className='flex flex-col space-y-8'
          initial='hidden'
          animate='visible'
          variants={fadeInUp}
          transition={{ duration: 0.3 }}
        >
          {!loaderData ? (
            <BannerCard
              message='Course Unpublished'
              description='Publish your course to unlock student progress tracking, insights, and performance stats.'
              variant='tip'
              className='mb-10'
              showCloseIcon={false}
              cta={{
                link: `/${params.organizationId}/builder/${params.courseId}/overview/publish`,
                title: 'Publish Course',
              }}
            />
          ) : (
            <pre className='bg-muted text-muted-foreground rounded-lg p-4 text-sm break-words whitespace-pre-wrap shadow-sm'>
              {JSON.stringify(loaderData, null, 2)}
            </pre>
          )}
        </motion.div>
      </section>
      <Outlet />
    </>
  );
}
