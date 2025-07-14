import React from 'react';
import { Await, NavLink, Outlet } from 'react-router';
import { BookOpen, ChevronRight, Clock, StarOff, TableOfContents } from 'lucide-react';
import { redirectWithError } from 'remix-toast';

import { getCategoryName } from '@gonasi/database/courseCategories';
import { getSubCategoryName } from '@gonasi/database/courseSubCategories';
import {
  fetchPublishedPublicCourseById,
  getEnrollmentStatus,
} from '@gonasi/database/publishedCourses';
import { timeAgo } from '@gonasi/utils/timeAgo';

import type { Route } from './+types/published-course-id-index';

import { UserAvatar } from '~/components/avatars';
import { GoThumbnail } from '~/components/cards/go-course-card';
import { GoPricingSheet } from '~/components/cards/go-course-card/GoPricingSheet';
import { ChapterLessonTree } from '~/components/course';
import { Badge } from '~/components/ui/badge';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';
import { getLowestPricingSummary } from '~/utils/get-lowest-pricing-summary';

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

// Meta
export function meta({ data }: Route.MetaArgs) {
  const course = data?.courseOverview;

  if (!course) {
    return [
      { title: 'Course Not Found • Gonasi' },
      {
        name: 'description',
        content: 'This course could not be found. Explore other learning opportunities on Gonasi.',
      },
    ];
  }

  const title = course.name;
  const shortDescription = course.description?.slice(0, 150) ?? 'Join this course on Gonasi.';

  return [
    {
      title: `${title} • Gonasi`,
    },
    {
      name: 'description',
      content: `${shortDescription} — an interactive course on Gonasi.`,
    },
  ];
}

// Top-level return type of the loader
export type CourseOverviewLoaderReturn = Exclude<Awaited<ReturnType<typeof loader>>, Response>;

// Only the `courseOverview` object from the return value
export type CourseOverviewType = CourseOverviewLoaderReturn['courseOverview'];

// Further specific inferences if needed:
export type CoursePricingDataType = CourseOverviewType['pricing_tiers'][number];

export type CourseChaptersType = CourseOverviewType['course_structure']['chapters'];

// Example: Lessons inside chapters
export type CourseLessonType = CourseChaptersType[number]['lessons'][number];

// Loader
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const publishedCourseId = params.publishedCourseId;

  const [courseOverview, enrollmentStatus] = await Promise.all([
    fetchPublishedPublicCourseById({
      supabase,
      courseId: publishedCourseId,
    }),
    getEnrollmentStatus({
      supabase,
      publishedCourseId: params.publishedCourseId,
    }),
  ]);

  if (!courseOverview) {
    return redirectWithError(`/go/explore`, 'Course not found');
  }

  const categoryName = getCategoryName({ supabase, id: courseOverview.category_id });
  const subCategoryName = getSubCategoryName({ supabase, id: courseOverview.subcategory_id });

  console.log('enrollment: ', enrollmentStatus);

  return { courseOverview, categoryName, subCategoryName, enrollmentStatus };
}

function MetaInfoItem({ label, timestamp }: { label: string; timestamp: string }) {
  return (
    <div className='font-secondary flex space-x-2 text-xs'>
      <div className='flex items-center space-x-1'>
        <Clock size={12} />
        <div>{label}</div>
      </div>
      <div className='text-foreground font-bold'>{timeAgo(timestamp)}</div>
    </div>
  );
}

export default function PublishedCourseIdIndex({ loaderData }: Route.ComponentProps) {
  const { categoryName, subCategoryName, enrollmentStatus } = loaderData;
  const {
    id,
    name,
    description,
    blur_hash,
    signed_url,
    course_structure,
    pricing_tiers,
    organizations: { handle, name: orgName, signed_avatar_url },
  } = loaderData.courseOverview;

  const daysRemaining = enrollmentStatus?.days_remaining ?? 0;

  const params = new URLSearchParams(location.search);
  const redirectTo = params.get('redirectTo');
  const closeLink = redirectTo ?? '/';

  return (
    <>
      <Modal open>
        <Modal.Content size='full'>
          <Modal.Header
            leadingIcon={
              <div className='border-foreground/20 flex w-10 flex-shrink-0 items-center justify-center rounded-full border'>
                <GoThumbnail
                  iconUrl={signed_url}
                  name={name}
                  blurHash={blur_hash}
                  objectFit='fill'
                />
              </div>
            }
            title={name}
            closeRoute={closeLink}
          />
          <Modal.Body className='px-0 md:px-4'>
            <div className='min-h-screen'>
              <div className='flex flex-col-reverse space-x-0 py-2 md:flex-row md:space-x-10 md:py-10'>
                {/* Left Content */}
                <div className='md:bg-card/50 flex w-full flex-1 flex-col space-y-4 bg-transparent p-4'>
                  <div className='flex items-center space-x-2 overflow-auto'>
                    <React.Suspense
                      fallback={
                        <Badge variant='outline' className='text-muted-foreground'>
                          Loading Category...
                        </Badge>
                      }
                    >
                      <Await resolve={categoryName}>
                        {(value) => <Badge variant='outline'>{value}</Badge>}
                      </Await>
                    </React.Suspense>

                    <ChevronRight size={12} />

                    <React.Suspense
                      fallback={
                        <Badge variant='outline' className='text-muted-foreground'>
                          Loading Subcategory...
                        </Badge>
                      }
                    >
                      <Await resolve={subCategoryName}>
                        {(value) => <Badge variant='outline'>{value}</Badge>}
                      </Await>
                    </React.Suspense>
                  </div>

                  <h2 className='line-clamp-3 text-xl'>{name}</h2>
                  <p className='font-secondary text-muted-foreground'>{description}</p>

                  <div className='pb-2'>
                    <StarOff size={14} className='text-gold' />
                  </div>

                  <NavLink to={`/${handle}`}>
                    {({ isPending }) => (
                      <UserAvatar
                        username={orgName}
                        imageUrl={signed_avatar_url}
                        size='xs'
                        isPending={isPending}
                        alwaysShowUsername
                      />
                    )}
                  </NavLink>

                  <div className='flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-4'>
                    <MetaInfoItem label='Published' timestamp='created_at' />
                    <MetaInfoItem label='Updated' timestamp='updated_at' />
                  </div>

                  <div className='flex items-center space-x-8 pt-2'>
                    <div className='flex items-center space-x-1'>
                      <TableOfContents size={12} />
                      <span>
                        {course_structure.total_chapters}{' '}
                        {course_structure.total_chapters === 1 ? 'chapter' : 'chapters'}
                      </span>
                    </div>
                    <div className='flex items-center space-x-1'>
                      <BookOpen size={12} />
                      <span>
                        {course_structure.total_lessons}{' '}
                        {course_structure.total_lessons === 1 ? 'lesson' : 'lessons'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Content */}
                <div className='mb-4 w-full md:w-80 lg:w-sm'>
                  <div className='flex flex-col'>
                    <GoThumbnail
                      iconUrl={signed_url}
                      name={name}
                      blurHash={blur_hash}
                      badges={[
                        enrollmentStatus?.is_active ? (
                          <div className='bg-card/85 flex items-center justify-between rounded-sm p-2'>
                            <div className='flex flex-col items-center text-center'>
                              <div className='flex items-center space-x-1' />
                              <div
                                className={cn(
                                  'flex items-center justify-center rounded-sm px-2 py-1 text-lg font-semibold',
                                  daysRemaining <= 1
                                    ? 'bg-red-100 text-red-600'
                                    : daysRemaining <= 3
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-green-100 text-green-700',
                                )}
                              >
                                {daysRemaining}
                              </div>
                              <div className='font-secondary mt-1 flex items-center space-x-1 text-xs'>
                                <Clock className='h-3 w-3' />{' '}
                                <div> {daysRemaining === 1 ? 'day' : 'days'}</div>
                              </div>
                            </div>
                          </div>
                        ) : null,
                      ]}
                    />
                    <div className='bg-card px-4'>
                      {enrollmentStatus?.is_active ? (
                        <div className='py-4'>hey</div>
                      ) : (
                        <div>
                          <div className='flex w-full items-center justify-between py-4'>
                            <GoPricingSheet
                              pricingData={pricing_tiers}
                              side='left'
                              variant='primary'
                              className='w-full'
                            />
                          </div>
                          <div className='flex w-full items-center justify-center space-x-1 pb-4 text-xs'>
                            {pricing_tiers[0]?.is_free ? null : (
                              <span className='text-muted-foreground'>Starting at</span>
                            )}
                            <span className='text-foreground text-sm font-semibold'>
                              {getLowestPricingSummary(pricing_tiers)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chapter Tree */}
              <div className='max-w-md px-4 md:max-w-xl md:px-0'>
                <ChapterLessonTree publishedCourseId={id} chapters={course_structure.chapters} />
              </div>
            </div>
          </Modal.Body>
        </Modal.Content>
      </Modal>
      <Outlet context={{ name, pricingData: pricing_tiers }} />
    </>
  );
}
