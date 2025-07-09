import { Outlet } from 'react-router';
import { motion } from 'framer-motion';
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

  const { data: canEdit } = await supabase.rpc('can_user_edit_course', {
    arg_course_id: courseId,
  });

  if (!courseOverview || canEdit === null) {
    return redirectWithError(
      `/${params.organizationId}/builder`,
      'Course not found or no permissions',
    );
  }

  return {
    courseOverview,
    canEditCourse: canEdit,
  };
}

const fadeInUp = {
  hidden: { opacity: 0, y: 2 },
  visible: { opacity: 1, y: 0 },
};

export default function CourseOverview({ loaderData, params }: Route.ComponentProps) {
  const {
    courseOverview: {
      signedUrl,
      blur_hash,
      name,
      id: courseId,
      description,
      course_categories,
      course_sub_categories,
      updated_at,
    },
    canEditCourse,
  } = loaderData;

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
          <motion.div
            className='flex flex-col space-y-4 space-x-0 md:flex-row md:space-y-0 md:space-x-8'
            variants={fadeInUp}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className='flex max-w-md items-center justify-center md:max-w-sm'>
              <CourseThumbnail
                thumbnail={signedUrl}
                blurHash={blur_hash}
                name={name}
                editLink={
                  canEditCourse
                    ? `/${params.organizationId}/builder/${courseId}/overview/edit-thumbnail`
                    : undefined
                }
              />
            </div>
            <div className='flex-1'>
              <CourseInfoOverview
                name={name}
                description={description}
                updatedAt={updated_at}
                canEditCourse={canEditCourse}
                editLink={
                  canEditCourse
                    ? `/${params.organizationId}/builder/${courseId}/overview/edit-details`
                    : undefined
                }
              />
            </div>
          </motion.div>

          <Separator />

          <motion.div
            className='flex flex-col space-y-4'
            variants={fadeInUp}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <BannerCard
              message='Provide additional context about your course by editing its category, sub-category, and learning pathway.'
              variant='info'
            />
            <div className='max-w-sm'>
              <CourseCategoryOverview
                category={course_categories?.name}
                subCategory={course_sub_categories?.name}
                editLink={
                  canEditCourse
                    ? `/${params.organizationId}/builder/${courseId}/overview/edit-grouping`
                    : undefined
                }
              />
            </div>
          </motion.div>
        </motion.div>
      </section>
      <Outlet />
    </>
  );
}
