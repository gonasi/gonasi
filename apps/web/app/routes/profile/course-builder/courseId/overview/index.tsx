import { Outlet, useOutletContext } from 'react-router';

import type { Route } from '../../+types/course-overview';
import type { CourseOverviewType } from '..';

import { BannerCard } from '~/components/cards';
import {
  CourseCategoryOverview,
  CourseOverview as CourseInfoOverview,
  CourseThumbnail,
} from '~/components/course';
import { Separator } from '~/components/ui/separator';

export default function CourseOverview({ params }: Route.ComponentProps) {
  const outletLoaderData = useOutletContext<CourseOverviewType>() ?? {};

  const {
    signedUrl,
    blur_hash,
    name,
    id: courseId,
    description,
    monthly_subscription_price,
    course_categories,
    course_sub_categories,
    pathways,
  } = outletLoaderData;

  return (
    <>
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
              price={monthly_subscription_price}
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
              pathway={pathways?.name}
              editLink={`/${params.username}/course-builder/${courseId}/overview/grouping/edit-category`}
            />
          </div>
        </div>
      </div>
      <Outlet context={outletLoaderData} />
    </>
  );
}
