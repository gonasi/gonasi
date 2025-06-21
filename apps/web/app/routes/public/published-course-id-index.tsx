import { Link } from 'react-router';
import { ArrowDown, BookOpen, ChevronRight, Clock, StarOff, TableOfContents } from 'lucide-react';
import { redirectWithError } from 'remix-toast';

import { fetchPublishedCourseById } from '@gonasi/database/publishedCourses';
import { timeAgo } from '@gonasi/utils/timeAgo';

import type { Route } from './+types/published-course-id-index';

import { UserAvatar } from '~/components/avatars';
import { GoThumbnail } from '~/components/cards/go-course-card';
import { GoPricingSheet } from '~/components/cards/go-course-card/GoPricingSheet';
import { ChapterLessonTree } from '~/components/course';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { createClient } from '~/lib/supabase/supabase.server';

export function headers(_: Route.HeadersArgs) {
  return {
    'Cache-Control': 's-maxage=1, stale-while-revalidate=59',
  };
}

// Meta
export function meta({ data }: Route.MetaArgs) {
  const course = data?.courseOverview;
  const username = data?.courseOverview.user.username;

  if (!course) {
    return [
      { title: 'Course Not Found | Gonasi' },
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
      title: `${title} by ${username} | Gonasi`,
    },
    {
      name: 'description',
      content: `${shortDescription} — an interactive course by ${username} on Gonasi.`,
    },
  ];
}

// Top-level return type of the loader
export type CourseOverviewLoaderReturn = Exclude<Awaited<ReturnType<typeof loader>>, Response>;

// Only the `courseOverview` object from the return value
export type CourseOverviewType = CourseOverviewLoaderReturn['courseOverview'];

// Further specific inferences if needed:
export type CoursePricingDataType = CourseOverviewType['pricing_data'][number];

export type CourseCategoryType = CourseOverviewType['course_categories'];

export type CourseSubCategoryType = CourseOverviewType['course_sub_categories'];

export type CoursePathwayType = CourseOverviewType['pathways'];

export type CourseChaptersType = CourseOverviewType['course_chapters'];

// Example: Lessons inside chapters
export type CourseLessonType = CourseChaptersType[number]['lessons'][number];

// Loader
export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const publishedCourseId = params.publishedCourseId;

  const courseOverview = await fetchPublishedCourseById({ supabase, publishedCourseId });

  if (!courseOverview) {
    return redirectWithError(`/`, 'Course not found');
  }

  return { courseOverview };
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
  const {
    name,
    description,
    course_categories,
    course_sub_categories,
    created_at,
    updated_at,
    lessons_count,
    chapters_count,
    pricing_data,
    course_chapters,
    blur_hash,
    signed_url,
  } = loaderData.courseOverview;

  const params = new URLSearchParams(location.search);
  const redirectTo = params.get('redirectTo');

  let closeLink = '/';

  if (redirectTo) {
    closeLink = redirectTo;
  }

  const categoryName = course_categories?.name;
  const subcategoryName = course_sub_categories?.name;

  return (
    <Modal open>
      <Modal.Content size='full'>
        <Modal.Header
          leadingIcon={
            <div className='border-foreground/20 flex w-10 flex-shrink-0 items-center justify-center rounded-full border'>
              <GoThumbnail iconUrl={signed_url} name={name} blurHash={blur_hash} objectFit='fill' />
            </div>
          }
          title={name}
          closeRoute={closeLink}
        />
        <Modal.Body className='px-0 md:px-4'>
          <div className='min-h-screen'>
            <div className='flex flex-col-reverse space-x-0 py-2 md:flex-row md:space-x-10 md:py-10'>
              {/* Left Content */}
              <div className='md:bg-card/50 flex flex-1 flex-col space-y-4 rounded-sm bg-transparent p-4'>
                <div className='flex items-center space-x-2 overflow-auto'>
                  <Badge variant='outline'>{categoryName}</Badge>
                  <ChevronRight size={12} />
                  <Badge variant='outline'>{subcategoryName}</Badge>
                </div>

                <h2 className='line-clamp-3 text-xl'>{name}</h2>
                <p className='font-secondary text-muted-foreground'>{description}</p>

                <div className='pb-2'>
                  <StarOff size={14} className='text-gold' />
                </div>

                <Link to='/'>
                  <UserAvatar username='username' imageUrl='' size='xs' />
                </Link>

                <div className='flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4'>
                  <MetaInfoItem label='Published' timestamp={created_at} />
                  <MetaInfoItem label='Updated' timestamp={updated_at} />
                </div>

                <div className='flex items-center space-x-8 pt-2'>
                  <div className='flex items-center space-x-1'>
                    <TableOfContents size={12} />
                    <span>
                      {chapters_count} {chapters_count === 1 ? 'chapter' : 'chapters'}
                    </span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <BookOpen size={12} />
                    <span>
                      {lessons_count} {lessons_count === 1 ? 'lesson' : 'lessons'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Content */}
              <div className='mb-4 min-w-full md:mb-0 md:min-w-xs lg:min-w-sm'>
                <div className='flex flex-col'>
                  <GoThumbnail
                    iconUrl={signed_url}
                    name={name}
                    blurHash={blur_hash} // badges={
                    //   loaderData.activeChapterAndLesson?.status === 'complete' ? ['Completed'] : []
                    // }
                  />
                  <div className='bg-card px-4 pb-4 md:bg-transparent md:px-0 md:pb-0'>
                    <div className='flex w-full items-center justify-between py-4'>
                      <div className='font-secondary inline-flex font-light'>
                        <span>
                          Select <span className='font-semibold'>tier</span> to continue...
                        </span>
                      </div>
                      <GoPricingSheet pricingData={pricing_data} side='left' variant='primary' />
                    </div>
                    {pricing_data[0]?.is_free ? null : (
                      <div className='flex w-full flex-col items-center justify-center'>
                        <div className='text-muted-foreground'>OR</div>
                        <div>
                          <Button variant='ghost' rightIcon={<ArrowDown />}>
                            View Free Chapters
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chapter Tree */}
            <div className='max-w-md px-4 md:max-w-xl md:px-0'>
              <ChapterLessonTree
                publishedCourseId={loaderData.courseOverview.id}
                chapters={course_chapters}
                // activeChapterAndLesson={loaderData.activeChapterAndLesson}
              />
            </div>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
