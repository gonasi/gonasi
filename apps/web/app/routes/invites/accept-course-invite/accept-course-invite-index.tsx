import { useEffect, useState } from 'react';
import { data, Outlet, redirect } from 'react-router';
import { motion, useAnimationControls } from 'framer-motion';
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  PlayCircle,
  TableOfContents,
  Users,
} from 'lucide-react';

import { fetchCohortById } from '@gonasi/database/cohorts';
import { fetchCourseInviteDetails, validateCourseInvite } from '@gonasi/database/courseInvites';
import { getUserProfile } from '@gonasi/database/profile';
import { fetchCourseOverviewWithProgress } from '@gonasi/database/publishedCourses';

import type { Route } from './+types/accept-course-invite-index';
import { CourseInviteCard, InviteErrorCard } from '../components';

import { PlainAvatar } from '~/components/avatars';
import { Badge } from '~/components/ui/badge';
import { NavLinkButton } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta({ data }: Route.MetaArgs) {
  // Handle error case
  if (!data || 'error' in data) {
    return [
      { title: 'Course Invitation • Gonasi' },
      {
        name: 'description',
        content: 'Accept your course invitation to start learning on Gonasi.',
      },
    ];
  }

  // Handle success case with course details
  const { invite } = data;
  const courseName = invite.courseName || 'Course';
  const organizationName = invite.organizationName || 'an organization';

  return [
    { title: `Join ${courseName} | Course Invitation` },
    {
      name: 'description',
      content: `You've been invited to join ${courseName} by ${organizationName}. Accept your invitation to start your learning journey.`,
    },
  ];
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { supabase, supabaseAdmin } = createClient(request);
  const { user } = await getUserProfile(supabase);

  const token = params.token;

  if (!token) return redirect('/');

  // If user is not logged in, redirect to login with return URL
  if (!user?.id || !user?.email) {
    const url = new URL(request.url);
    const returnUrl = `${url.pathname}`;
    return redirect(`/login?redirectTo=${encodeURIComponent(returnUrl)}`);
  }

  if (!isValidUUID(token)) {
    console.error('[accept-course-invite] Invalid UUID:', { token });
    return data({ error: { message: 'Invalid invitation token format.' }, user });
  }

  // Validate the course invite using database function
  const result = await validateCourseInvite(supabaseAdmin, token, user.email);

  if (!result.success) {
    return data({ error: { message: result.message }, user });
  }

  // Check if user is already enrolled
  const { data: existingEnrollment } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('published_course_id', result.data!.publishedCourseId)
    .maybeSingle();

  if (existingEnrollment) {
    return data({
      error: { message: 'You are already enrolled in this course.' },
      user,
    });
  }

  // Fetch additional course details for better display (use supabaseAdmin to bypass RLS)
  const [courseDetails, courseOverview] = await Promise.all([
    fetchCourseInviteDetails(supabaseAdmin, result.data!.publishedCourseId),
    fetchCourseOverviewWithProgress({
      supabase: supabaseAdmin,
      courseId: result.data!.publishedCourseId,
    }),
  ]);

  // Fetch cohort name if applicable (use supabaseAdmin to bypass RLS)
  let cohortName = null;
  if (result.data!.cohortId) {
    const cohortData = await fetchCohortById(supabaseAdmin, result.data!.cohortId);
    cohortName = cohortData?.name || null;
  }

  // Verify that the pricing tier from the invite exists in the course
  const matchingPricingTier = courseOverview?.course?.pricing_tiers?.find(
    (tier) => tier.tier_name === result.data!.tierName,
  );

  if (!matchingPricingTier) {
    return data({
      error: {
        message: `The pricing tier "${result.data!.tierName}" associated with this invitation is no longer available for this course. Please contact ${result.data!.organizationName} for assistance.`,
      },
      user,
    });
  }

  // Return invite data for display
  return data({
    invite: {
      id: result.data!.inviteId,
      courseName: result.data!.courseName,
      organizationName: result.data!.organizationName,
      tierName: result.data!.tierName,
      isFree: result.data!.isFree,
      price: result.data!.price,
      currencyCode: result.data!.currencyCode,
      expiresAt: result.data!.expiresAt,
      // Additional details from courseDetails
      description: courseDetails?.description || '',
      imageUrl: courseDetails?.imageUrl || null,
      publishedAt: courseDetails?.publishedAt || null,
      categoryName: courseDetails?.categoryName || null,
      subCategoryName: courseDetails?.subCategoryName || null,
      organizationAvatarUrl: courseDetails?.organizationAvatarUrl || null,
      cohortName,
    },
    courseOverview,
    user,
    publishedCourseId: result.data!.publishedCourseId,
    inviteToken: token,
    pricingTierId: matchingPricingTier.id,
  });
};

export default function AcceptCourseInvite({ loaderData }: Route.ComponentProps) {
  // Scroll detection for floating CTA
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const controls = useAnimationControls();

  useEffect(() => {
    const handleScroll = () => {
      // Show CTA after scrolling 300px
      if (window.scrollY > 300) {
        setShowFloatingCTA(true);
      } else {
        setShowFloatingCTA(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Subtle floating animation
  useEffect(() => {
    if (showFloatingCTA) {
      controls.start({
        y: [0, -8, 0],
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      });
    }
  }, [showFloatingCTA, controls]);

  // Show error state if there's an error
  if ('error' in loaderData) {
    return (
      <InviteErrorCard
        message={loaderData.error?.message || 'This invitation is no longer valid.'}
        username={loaderData.user.full_name || loaderData.user.username || 'User'}
        imageUrl={loaderData.user.signed_url || null}
      />
    );
  }

  const { invite, user, courseOverview, publishedCourseId, inviteToken, pricingTierId } =
    loaderData;
  const { course, chapters } = courseOverview || {};

  // Calculate expiration urgency
  const getExpirationUrgency = () => {
    if (!invite.expiresAt) return null;
    const now = new Date();
    const expires = new Date(invite.expiresAt);
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 3) return { days: daysLeft, urgent: true };
    if (daysLeft <= 7) return { days: daysLeft, urgent: false };
    return null;
  };

  const expirationUrgency = getExpirationUrgency();

  // Success state - show invite details and accept button
  return (
    <>
      <div className='px-0 py-4 md:px-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className='container mx-auto space-y-8'
        >
          {/* Header */}
          <div className='flex flex-col items-center space-y-4 text-center'>
            <div>
              <PlainAvatar
                username={user.full_name || user.username || 'User'}
                imageUrl={user.signed_url || null}
                isActive
                size='md'
                className='py-4'
              />
              <h1 className='text-3xl font-bold md:text-4xl'>
                {invite.organizationName} Invited You to Learn
              </h1>
              <p className='text-muted-foreground font-secondary mt-2 text-lg md:text-xl'>
                {invite.isFree
                  ? 'Your exclusive free access is ready'
                  : 'You have special access to join this course'}
              </p>
            </div>

            {/* Urgency Banner */}
            {expirationUrgency && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`flex items-center gap-2 rounded-full px-2 py-1 ${
                  expirationUrgency.urgent
                    ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                }`}
              >
                <Clock className='size-4' />
                <span className='text-xs font-medium'>
                  {expirationUrgency.days === 1
                    ? 'Invitation expires in 24 hours'
                    : `Only ${expirationUrgency.days} days left to accept`}
                </span>
              </motion.div>
            )}
          </div>

          <div className='relative flex flex-col space-x-0 md:flex-row md:space-x-8'>
            <div className='w-full md:w-[60%]'>
              {/* Course Invite Card */}
              <CourseInviteCard
                courseName={invite.courseName}
                description={invite.description}
                imageUrl={invite.imageUrl}
                organizationName={invite.organizationName}
                organizationPhotoUrl={invite.organizationAvatarUrl}
                categoryName={invite.categoryName}
                subCategoryName={invite.subCategoryName}
                publishedAt={invite.publishedAt}
                cohortName={invite.cohortName}
                tierName={invite.tierName}
                isFree={invite.isFree}
                price={invite.price}
                currencyCode={invite.currencyCode}
                expiresAt={invite.expiresAt}
              />

              {/* Course Stats */}
              {course && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className='bg-muted/30 grid grid-cols-2 gap-4 p-4 md:p-8'
                >
                  <div className='flex items-center gap-3'>
                    <div className='bg-primary/10 text-primary rounded-full p-3'>
                      <TableOfContents className='size-5' />
                    </div>
                    <div>
                      <p className='text-2xl font-bold'>{course.total_chapters}</p>
                      <p className='text-muted-foreground text-sm'>
                        {course.total_chapters === 1 ? 'Chapter' : 'Chapters'}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <div className='bg-primary/10 text-primary rounded-full p-3'>
                      <BookOpen className='size-5' />
                    </div>
                    <div>
                      <p className='text-2xl font-bold'>{course.total_lessons}</p>
                      <p className='text-muted-foreground text-sm'>
                        {course.total_lessons === 1 ? 'Lesson' : 'Lessons'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Course Curriculum */}
              {chapters && chapters.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className='rounded-none border-0 px-4 shadow-none md:px-8'>
                    <CardHeader className='px-0'>
                      <CardTitle className='flex items-center gap-2 text-2xl'>
                        <PlayCircle className='size-6' />
                        <span className='mt-1'>{`What You'll Learn`}</span>
                      </CardTitle>
                      <p className='text-muted-foreground font-secondary text-sm'>
                        Complete curriculum designed to take you from beginner to expert
                      </p>
                    </CardHeader>
                    <CardContent className='space-y-4 px-0'>
                      {chapters.map((chapter, idx) => (
                        <div
                          key={chapter.id}
                          className='border-border space-y-2 rounded-lg border p-4'
                        >
                          <div className='flex items-start justify-between gap-4'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2'>
                                <Badge variant='outline' className='text-xs'>
                                  Chapter {idx + 1}
                                </Badge>
                                <h3 className='mt-1 font-semibold'>{chapter.name}</h3>
                              </div>
                              {chapter.description && (
                                <p className='text-muted-foreground font-secondary mt-2 text-sm'>
                                  {chapter.description}
                                </p>
                              )}
                            </div>
                            <Badge variant='secondary' className='flex-shrink-0'>
                              {chapter.total_lessons}{' '}
                              {chapter.total_lessons === 1 ? 'lesson' : 'lessons'}
                            </Badge>
                          </div>
                          {chapter.lessons && chapter.lessons.length > 0 && (
                            <div className='border-l-border mt-3 ml-4 space-y-2 border-l-2 pl-4'>
                              {chapter.lessons.slice(0, 3).map((lesson) => (
                                <div key={lesson.id} className='flex items-center gap-2 text-sm'>
                                  <ChevronRight className='text-muted-foreground size-4 flex-shrink-0' />
                                  <span className='text-muted-foreground'>{lesson.name}</span>
                                </div>
                              ))}
                              {chapter.lessons.length > 3 && (
                                <p className='text-muted-foreground text-xs italic'>
                                  + {chapter.lessons.length - 3} more{' '}
                                  {chapter.lessons.length - 3 === 1 ? 'lesson' : 'lessons'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* What You'll Get */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className='space-y-6 px-4 py-8 md:px-0 md:py-16'
              >
                <div>
                  <h3 className='text-3xl font-semibold md:text-4xl'>
                    Everything Included in Your Access
                  </h3>
                  <p className='text-muted-foreground font-secondary mt-2 text-lg'>
                    {invite.isFree
                      ? `${invite.organizationName} is covering the full cost for you`
                      : `Premium features included with your ${invite.tierName} access`}
                  </p>
                </div>
                <div className='space-y-4'>
                  <div className='flex items-start gap-3'>
                    <CheckCircle2 className='text-primary size-6 flex-shrink-0' />
                    <div>
                      <p className='font-secondary text-lg font-medium'>Complete Course Access</p>
                      <p className='text-muted-foreground font-secondary text-sm'>
                        Unlock all {course?.total_chapters} chapters and {course?.total_lessons}{' '}
                        lessons immediately after enrolling
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3'>
                    <CheckCircle2 className='text-primary size-6 flex-shrink-0' />
                    <div>
                      <p className='font-secondary text-lg font-medium'>
                        {invite.isFree ? 'No Payment Required' : `${invite.tierName} Tier Benefits`}
                      </p>
                      <p className='text-muted-foreground font-secondary text-sm'>
                        {invite.isFree
                          ? 'Completely free with no hidden fees or future charges'
                          : `Full access to premium features and exclusive content`}
                      </p>
                    </div>
                  </div>
                  {invite.cohortName && (
                    <div className='flex items-start gap-3'>
                      <CheckCircle2 className='text-primary size-6 flex-shrink-0' />
                      <div>
                        <p className='font-secondary text-lg font-medium'>
                          Exclusive Cohort Community
                        </p>
                        <p className='text-muted-foreground font-secondary text-sm'>
                          Join the {invite.cohortName} cohort and connect with fellow learners
                        </p>
                      </div>
                    </div>
                  )}
                  <div className='flex items-start gap-3'>
                    <CheckCircle2 className='text-primary size-6 flex-shrink-0' />
                    <div>
                      <p className='font-secondary text-lg font-medium'>Learn at Your Own Pace</p>
                      <p className='text-muted-foreground font-secondary text-sm'>
                        Interactive lessons with progress tracking and lifetime access to course
                        materials
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3'>
                    <CheckCircle2 className='text-primary size-6 flex-shrink-0' />
                    <div>
                      <p className='font-secondary text-lg font-medium'>Instant Access</p>
                      <p className='text-muted-foreground font-secondary text-sm'>
                        {invite.isFree
                          ? 'Start learning immediately - no payment or approval needed'
                          : 'Begin your learning journey right after enrollment is complete'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <Separator />
            </div>

            {/* Desktop: Sticky right sidebar */}
            <div className='hidden md:block md:w-[40%]'>
              <div className='sticky top-8 space-y-4'>
                <Card className='rounded-none shadow-none'>
                  <CardContent className='space-y-6 px-8'>
                    <div className='space-y-2'>
                      <h3 className='text-2xl font-bold'>
                        {invite.isFree ? 'Claim Your Free Access' : 'Complete Your Enrollment'}
                      </h3>
                      <p className='text-muted-foreground font-secondary'>
                        {invite.isFree
                          ? 'This invitation gives you complimentary access to the full course'
                          : 'Secure your spot and start learning today'}
                      </p>
                    </div>

                    <Separator />

                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium'>Course Access:</span>
                        <Badge variant='secondary' className='text-sm'>
                          {invite.tierName}
                        </Badge>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium'>
                          {invite.isFree ? 'Your Price:' : 'Total:'}
                        </span>
                        <span className='text-xl font-bold'>
                          {invite.isFree ? (
                            <span className='text-green-600 dark:text-green-500'>FREE</span>
                          ) : (
                            <span>
                              {invite.currencyCode} {invite.price?.toLocaleString()}
                            </span>
                          )}
                        </span>
                      </div>
                      {!invite.isFree && (
                        <div className='bg-muted/50 rounded-lg p-2'>
                          <p className='text-muted-foreground text-xs'>
                            One-time payment • Lifetime access • Secure checkout
                          </p>
                        </div>
                      )}
                      {invite.expiresAt && (
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-medium'>Offer Expires:</span>
                          <div className='flex items-center space-x-2 text-amber-700 dark:text-amber-400'>
                            <CalendarClock size={16} />
                            <span className='mt-1 text-sm font-semibold'>
                              {new Date(invite.expiresAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className='space-y-3'>
                      <NavLinkButton
                        to={`/i/course-invites/${inviteToken}/accept/enroll/${pricingTierId}`}
                        className='w-full text-base font-semibold'
                        size='lg'
                      >
                        {invite.isFree ? 'Claim Free Access' : 'Enroll Now'}
                      </NavLinkButton>
                      <p className='text-muted-foreground font-secondary text-center text-xs'>
                        {invite.isFree
                          ? 'No credit card required • Start learning instantly'
                          : 'Secure payment • Start learning immediately after checkout'}
                      </p>
                    </div>

                    {!invite.isFree && (
                      <div className='border-t pt-4'>
                        <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                          <Users className='size-4' />
                          <span>Join other learners already enrolled in this course</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Trust Signals */}
                <div className='bg-muted/30 space-y-2 p-4'>
                  <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                    Trusted By
                  </p>
                  <p className='font-secondary text-sm'>{invite.organizationName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Bottom sticky CTA (shows after scrolling) */}
          {showFloatingCTA && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className='fixed inset-x-0 -bottom-8 z-50 md:hidden'
            >
              <div className='bg-background/98 border-primary/20 border-t-2 p-4 shadow-2xl backdrop-blur-md'>
                <div className='flex items-center justify-between gap-4'>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate font-semibold'>{invite.courseName}</p>
                    <p className='text-sm'>
                      {invite.isFree ? (
                        <span className='font-semibold text-green-600 dark:text-green-500'>
                          FREE Access
                        </span>
                      ) : (
                        <span className='text-muted-foreground'>
                          {invite.currencyCode} {invite.price?.toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <motion.div animate={controls} className='flex-shrink-0'>
                    <NavLinkButton
                      to={`/i/course-invites/${inviteToken}/accept/enroll/${pricingTierId}`}
                      className='px-6 py-3 text-base font-bold shadow-lg'
                    >
                      {invite.isFree ? 'Claim Now' : 'Enroll'}
                    </NavLinkButton>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Footer Note */}
          <div className='md:bg-muted/30 rounded-lg bg-none p-4 text-center md:p-6'>
            <p className='text-muted-foreground font-secondary text-sm'>
              {invite.isFree
                ? `This exclusive invitation from ${invite.organizationName} gives you full course access at no cost. Accept now to start learning.`
                : `Secure your enrollment to access all course content and join the learning community.`}
            </p>
          </div>

          {/* Spacing for mobile floating CTA */}
          <div className='h-24 md:hidden' />
        </motion.div>
      </div>

      <Outlet
        context={{
          courseName: invite.courseName,
          publishedCourseId,
          pricingData: course?.pricing_tiers || [],
          inviteToken,
        }}
      />
    </>
  );
}
