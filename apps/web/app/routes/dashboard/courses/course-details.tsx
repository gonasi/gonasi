import { Outlet, useOutletContext } from 'react-router';

import type { Route } from './+types/course-details';
import type { CourseDetailsType } from './course-by-id';

import { BannerCard } from '~/components/cards';
import {
  CourseCategoryDetails,
  CourseDetails as CourseInfoDetails,
  CourseThumbnail,
} from '~/components/course';
import { Separator } from '~/components/ui/separator';

export default function CourseDetails({ params }: Route.ComponentProps) {
  const outletLoaderData = useOutletContext<CourseDetailsType>() ?? {};

  const {
    signedUrl,
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
              name={name}
              editLink={`/dashboard/${params.companyId}/courses/${courseId}/course-details/edit-image`}
            />
          </div>
          <div className='flex-1'>
            <CourseInfoDetails
              name={name}
              description={description}
              price={monthly_subscription_price}
              editLink={`/dashboard/${params.companyId}/courses/${courseId}/course-details/edit-details`}
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
            <CourseCategoryDetails
              category={course_categories?.name}
              subCategory={course_sub_categories?.name}
              pathway={pathways?.name}
              editLink={`/dashboard/${params.companyId}/courses/${courseId}/course-details/grouping/edit-category`}
            />
          </div>
        </div>
      </div>
      <Outlet context={outletLoaderData} />
    </>
  );
}
