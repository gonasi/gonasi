import { Outlet } from 'react-router';
import { motion } from 'framer-motion';

import { fetchPublishedCourseDetails } from '@gonasi/database/courses';

import type { Route } from './+types/published-overview-index';
import {
  CourseHeader,
  CourseMetrics,
  CourseStructure,
  PricingTiers,
  RecentEnrollments,
} from './components';

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
  if (!loaderData) {
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
            <BannerCard
              message='Course Unpublished'
              description='Publish your course to unlock student progress tracking, insights, and performance stats.'
              variant='info'
              className='mb-10'
              showCloseIcon={false}
              cta={{
                to: `/${params.organizationId}/builder/${params.courseId}/overview/publish`,
                children: 'Publish Course',
              }}
            />
          </motion.div>
        </section>
        <Outlet />
      </>
    );
  }

  return (
    <>
      <section className='pb-16'>
        <motion.div
          className='flex flex-col space-y-8'
          initial='hidden'
          animate='visible'
          variants={fadeInUp}
          transition={{ duration: 0.3 }}
        >
          <CourseHeader
            name={loaderData.name}
            description={loaderData.description}
            image_url={loaderData.image_url}
            visibility={loaderData.visibility}
            is_active={loaderData.is_active}
            published_at={loaderData.published_at}
            has_free_tier={loaderData.has_free_tier}
            course_categories={loaderData.course_categories}
            course_sub_categories={loaderData.course_sub_categories}
            organizations={loaderData.organizations}
          />

          <CourseMetrics
            total_enrollments={loaderData.total_enrollments}
            active_enrollments={loaderData.active_enrollments}
            completion_rate={loaderData.completion_rate}
            average_rating={loaderData.average_rating}
            total_reviews={loaderData.total_reviews}
            total_chapters={loaderData.total_chapters}
            total_lessons={loaderData.total_lessons}
            total_blocks={loaderData.total_blocks}
          />

          <PricingTiers pricing_tiers={loaderData.pricing_tiers} />

          <CourseStructure course_structure_overview={loaderData.course_structure_overview} />

          <RecentEnrollments course_enrollments={loaderData.course_enrollments} />
        </motion.div>
      </section>
      <Outlet />
    </>
  );
}
