import { Outlet } from 'react-router';
import { motion } from 'framer-motion';

import { fetchCourseUsersProgress, fetchPublishedCourseDetails } from '@gonasi/database/courses';

import type { Route } from './+types/published-overview-index';
import {
  CourseHeader,
  CourseMetrics,
  CourseStructure,
  PricingTiers,
  UserProgressTable,
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

  const [publishedCourse, usersProgress] = await Promise.all([
    fetchPublishedCourseDetails({
      supabase,
      publishedCourseId: params.courseId,
    }),
    fetchCourseUsersProgress({
      supabase,
      publishedCourseId: params.courseId ?? '',
    }),
  ]);

  return { publishedCourse, usersProgress };
}

const fadeInUp = {
  hidden: { opacity: 0, y: 2 },
  visible: { opacity: 1, y: 0 },
};

export default function CourseOverview({ loaderData, params }: Route.ComponentProps) {
  const { publishedCourse, usersProgress } = loaderData;

  if (!publishedCourse) {
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
            name={publishedCourse.name}
            description={publishedCourse.description}
            image_url={publishedCourse.image_url}
            visibility={publishedCourse.visibility}
            is_active={publishedCourse.is_active}
            published_at={publishedCourse.published_at}
            has_free_tier={publishedCourse.has_free_tier}
            course_categories={publishedCourse.course_categories}
            course_sub_categories={publishedCourse.course_sub_categories}
            organizations={publishedCourse.organizations}
          />

          <CourseMetrics
            total_enrollments={publishedCourse.total_enrollments}
            active_enrollments={publishedCourse.active_enrollments}
            completion_rate={publishedCourse.completion_rate}
            average_rating={publishedCourse.average_rating}
            total_reviews={publishedCourse.total_reviews}
            total_chapters={publishedCourse.total_chapters}
            total_lessons={publishedCourse.total_lessons}
            total_blocks={publishedCourse.total_blocks}
          />

          <UserProgressTable
            usersProgress={usersProgress}
            courseEnrollments={publishedCourse.course_enrollments}
            learnersRoute={`/${params.organizationId}/builder/${params.courseId}/learners`}
          />

          <PricingTiers pricing_tiers={publishedCourse.pricing_tiers} />

          <CourseStructure course_structure_overview={publishedCourse.course_structure_overview} />
        </motion.div>
      </section>
      <Outlet />
    </>
  );
}
