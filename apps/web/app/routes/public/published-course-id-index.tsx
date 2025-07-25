// External dependencies
import { Suspense } from 'react';
import { Await, NavLink, Outlet } from 'react-router';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  LoaderCircle,
  StarOff,
  TableOfContents,
  TimerReset,
} from 'lucide-react';
import { redirectWithError } from 'remix-toast';

// Internal utilities
import {
  fetchCourseOverviewWithProgress,
  getEnrollmentStatus,
  getUnifiedNavigation,
} from '@gonasi/database/publishedCourses';
import { timeAgo } from '@gonasi/utils/timeAgo';

// Types
import type { Route } from './+types/published-course-id-index';

// Components
import { UserAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { GoThumbnail } from '~/components/cards/go-course-card';
import { GoPricingSheet } from '~/components/cards/go-course-card/GoPricingSheet';
import { ChapterLessonTree } from '~/components/course';
import { Badge } from '~/components/ui/badge';
import { NavLinkButton } from '~/components/ui/button';
import { CircularProgress } from '~/components/ui/circular-progress';
import { Modal } from '~/components/ui/modal';
import { Progress } from '~/components/ui/progress';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';
import { getLowestPricingSummary } from '~/utils/get-lowest-pricing-summary';

export function meta({ data }: Route.MetaArgs) {
  const course = data?.courseOverview?.course;

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
    { title: `${title} • Gonasi` },
    { name: 'description', content: `${shortDescription} — an interactive course on Gonasi.` },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const publishedCourseId = params.publishedCourseId;

  const [courseOverview, enrollmentStatus] = await Promise.all([
    fetchCourseOverviewWithProgress({ supabase, courseId: publishedCourseId }),
    getEnrollmentStatus({ supabase, publishedCourseId }),
  ]);

  if (!courseOverview) {
    return redirectWithError('/explore', 'Could not find course data');
  }

  const lessonNavigationPromise = getUnifiedNavigation({
    supabase,
    courseId: params.publishedCourseId,
  });

  return { courseOverview, enrollmentStatus, lessonNavigationPromise };
}

const motionConfig = {
  fadeInUp: {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.4 } },
  },
};

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

export default function PublishedCourseIdIndex({ params, loaderData }: Route.ComponentProps) {
  const { course, chapters, organization, overall_progress } = loaderData.courseOverview;
  const daysRemaining = loaderData.enrollmentStatus?.days_remaining ?? 0;

  const searchParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : '',
  );
  const redirectTo = searchParams.get('redirectTo') ?? '/';

  if (!course || !organization || !chapters) {
    return <NotFoundCard message='Could not load course' />;
  }

  const badgeContent = loaderData.enrollmentStatus?.is_active && (
    <div className='bg-card/85 flex items-center justify-between rounded-sm p-2'>
      <div className='flex flex-col items-center text-center'>
        <div
          className={cn(
            'flex items-center justify-center rounded-sm px-2 py-1 text-lg font-semibold',
            daysRemaining <= 1
              ? 'bg-danger/90 text-danger-foreground'
              : daysRemaining <= 3
                ? 'bg-warning/90 text-warning-foreground'
                : 'bg-success/90 text-success-foreground',
          )}
        >
          {daysRemaining}
        </div>
        <div className='font-secondary mt-1 flex items-center space-x-1 text-xs'>
          <Clock className='h-3 w-3' />
          <div>{daysRemaining === 1 ? 'day' : 'days'}</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Modal open>
        <Modal.Content size='full'>
          <Modal.Header
            leadingIcon={
              <Suspense
                fallback={
                  <CircularProgress size={40} thickness={3} colorClass='text-primary/5' value={0} />
                }
              >
                <Await
                  resolve={loaderData.lessonNavigationPromise}
                  errorElement={
                    <CircularProgress
                      size={40}
                      thickness={3}
                      colorClass='text-transparent'
                      value={0}
                    />
                  }
                >
                  {(navigationData) => {
                    if (!navigationData) return null;

                    return (
                      <CircularProgress
                        size={40}
                        thickness={3}
                        colorClass='text-primary'
                        value={
                          navigationData.completion.course.is_complete
                            ? 100
                            : navigationData.completion.blocks.percentage
                        }
                      >
                        <GoThumbnail
                          iconUrl={course.image_url}
                          name={course.name}
                          blurHash={course.blur_hash}
                          objectFit='fill'
                          className='m-1 rounded-full'
                          aspectRatio='1/1'
                        />
                      </CircularProgress>
                    );
                  }}
                </Await>
              </Suspense>
            }
            title={course.name}
            closeRoute={redirectTo}
          />
          <Modal.Body className='px-0 md:px-4'>
            <motion.div
              className='min-h-screen'
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className='flex flex-col-reverse space-x-0 py-2 md:flex-row md:space-x-10 md:py-10'>
                {/* Main content */}
                <motion.div
                  className='md:bg-card/50 flex w-full flex-1 flex-col space-y-4 bg-transparent p-4'
                  variants={motionConfig.fadeInUp}
                  initial='hidden'
                  animate='show'
                >
                  <div className='flex items-center space-x-2 overflow-auto'>
                    <Badge variant='outline'>{course.category_name}</Badge>
                    <ChevronRight size={12} />
                    <Badge variant='outline'>{course.subcategory_name}</Badge>
                  </div>

                  <h2 className='line-clamp-3 text-xl'>{course.name}</h2>
                  <p className='font-secondary text-muted-foreground'>{course.description}</p>

                  <motion.div variants={motionConfig.fadeIn} initial='hidden' animate='show'>
                    <div className='flex gap-2 pb-2'>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarOff key={i} size={14} className='text-muted-foreground' />
                      ))}
                    </div>
                  </motion.div>

                  <NavLink to={`/${organization.handle}`}>
                    {({ isPending }) => (
                      <UserAvatar
                        username={organization.name}
                        imageUrl={organization.avatar_url}
                        size='xs'
                        isPending={isPending}
                        alwaysShowUsername
                      />
                    )}
                  </NavLink>

                  <motion.div variants={motionConfig.fadeIn} initial='hidden' animate='show'>
                    <div className='flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-4'>
                      <MetaInfoItem label='Published' timestamp={course.published_at} />
                      <MetaInfoItem label='Updated' timestamp={course.published_at} />
                    </div>
                  </motion.div>

                  <div className='flex items-center space-x-8 pt-2'>
                    <div className='flex items-center space-x-1'>
                      <TableOfContents size={12} />
                      <span>
                        {course.total_chapters}{' '}
                        {course.total_chapters === 1 ? 'chapter' : 'chapters'}
                      </span>
                    </div>
                    <div className='flex items-center space-x-1'>
                      <BookOpen size={12} />
                      <span>
                        {course.total_lessons} {course.total_lessons === 1 ? 'lesson' : 'lessons'}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Side panel */}
                <motion.div
                  className='mb-4 w-full md:w-80 lg:w-sm'
                  variants={motionConfig.fadeInUp}
                  initial='hidden'
                  animate='show'
                >
                  <div className='flex flex-col'>
                    <GoThumbnail
                      iconUrl={course.image_url}
                      name={course.name}
                      blurHash={course.blur_hash}
                      badges={[badgeContent]}
                    />

                    <div className='bg-card'>
                      {loaderData.enrollmentStatus?.is_active ? (
                        <div className=''>
                          <Suspense fallback={<LoaderCircle className='animate-spin' />}>
                            <Await
                              resolve={loaderData.lessonNavigationPromise}
                              errorElement={
                                <div className='text-muted-foreground text-center text-sm'>
                                  {`We couldn't load the next lesson right now.`}
                                </div>
                              }
                            >
                              {(navigationData) => {
                                if (!navigationData) return null;

                                const AnimatedCheck = motion(CheckCircle);

                                return (
                                  <div className='flex flex-col items-center'>
                                    <Progress
                                      value={
                                        navigationData.completion.course.is_complete
                                          ? 100
                                          : navigationData.completion.blocks.percentage
                                      }
                                      className='h-1 rounded-none'
                                      bgClassName='from-secondary/70 to-primary/70 bg-gradient-to-r'
                                    />
                                    <div className='w-full px-4 py-4'>
                                      {navigationData.completion.course.is_complete ? (
                                        <div className='flex flex-col space-y-4'>
                                          <div className='flex items-center gap-2'>
                                            <AnimatedCheck
                                              className='h-5 w-5'
                                              strokeWidth={2}
                                              animate={{ scale: [1, 1.1, 1] }}
                                              transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: 'easeInOut',
                                              }}
                                            />
                                            <span className='text-md mt-0.5 font-semibold'>
                                              Course Completed
                                            </span>
                                          </div>
                                          <div>
                                            <NavLinkButton
                                              to={`/c/${params.publishedCourseId}/reset`}
                                              variant='danger'
                                              className='w-full'
                                              rightIcon={<TimerReset />}
                                            >
                                              Reset Course
                                            </NavLinkButton>
                                          </div>
                                        </div>
                                      ) : (
                                        <NavLinkButton
                                          className='w-full'
                                          rightIcon={<ArrowDown />}
                                          variant='secondary'
                                          to={
                                            navigationData.current?.chapter?.id
                                              ? `/c/${params.publishedCourseId}?continue=${navigationData.current.chapter.id}`
                                              : `/c/${params.publishedCourseId}`
                                          }
                                        >
                                          Continue
                                        </NavLinkButton>
                                      )}
                                    </div>
                                  </div>
                                );
                              }}
                            </Await>
                          </Suspense>
                        </div>
                      ) : (
                        <>
                          <div className='flex w-full items-center justify-between px-4 py-4'>
                            <GoPricingSheet
                              pricingData={course.pricing_tiers}
                              side='left'
                              variant='primary'
                              className='w-full'
                            />
                          </div>
                          <div className='flex w-full items-center justify-center space-x-1 pb-4 text-xs'>
                            {!course.pricing_tiers[0]?.is_free && (
                              <span className='text-muted-foreground'>Starting at</span>
                            )}
                            <span className='text-foreground text-sm font-semibold'>
                              {getLowestPricingSummary(course.pricing_tiers)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Chapter Tree */}
              <motion.div
                className='max-w-md px-4 md:max-w-xl md:px-0'
                variants={motionConfig.fadeInUp}
                initial='hidden'
                animate='show'
              >
                <ChapterLessonTree
                  publishedCourseId={course.id}
                  chapters={chapters}
                  userHasAccess={loaderData.enrollmentStatus?.is_active ?? false}
                  activeChapterId={overall_progress?.active_chapter_id}
                  activeLessonId={overall_progress?.active_lesson_id}
                />
              </motion.div>
            </motion.div>
          </Modal.Body>
        </Modal.Content>
      </Modal>

      <Outlet
        context={{
          name: course.name,
          pricingData: course.pricing_tiers,
        }}
      />
    </>
  );
}
