import { useEffect, useState } from 'react';
import { data, redirect } from 'react-router';
import { motion, useAnimationControls } from 'framer-motion';
import { BookOpen, CheckCircle2, ChevronRight, PlayCircle, TableOfContents } from 'lucide-react';

import { fetchCohortById } from '@gonasi/database/cohorts';
import { fetchCourseInviteDetails, validateCourseInvite } from '@gonasi/database/courseInvites';
import { getUserProfile } from '@gonasi/database/profile';
import { fetchCourseOverviewWithProgress } from '@gonasi/database/publishedCourses';

import type { Route } from './+types/accept-course-invite';
import { CourseInviteCard, InviteErrorCard } from './components';

import { PlainAvatar } from '~/components/avatars';
import { PricingOptionCard } from '~/components/cards/go-course-card/PricingOptionCard';
import { Badge } from '~/components/ui/badge';
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
    return data({ error: { message: 'Invalid invitation token format.' } });
  }

  // Validate the course invite using database function
  const result = await validateCourseInvite(supabaseAdmin, token, user.email);

  if (!result.success) {
    return data({ error: { message: result.message } });
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
      />
    );
  }

  const { invite, user, courseOverview } = loaderData;
  const { course, chapters } = courseOverview || {};

  // Find the pricing tier that matches the invite
  const matchingPricingTier = course?.pricing_tiers?.find(
    (tier) => tier.tier_name === invite.tierName,
  );

  // Success state - show invite details and accept button
  return (
    <div className='px-0 py-12 md:px-4'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className='mx-auto max-w-4xl space-y-8'
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
            <h1 className='text-3xl font-bold'>You&apos;re Invited!</h1>
            <p className='text-muted-foreground font-secondary text-lg'>
              Join an exclusive learning experience
            </p>
          </div>
        </div>

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
            className='bg-muted/30 grid grid-cols-2 gap-4 rounded-lg p-6'
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
            <Card className='rounded-none border-0 shadow-none'>
              <CardHeader className='px-0'>
                <CardTitle className='flex items-center gap-2'>
                  <PlayCircle className='size-5' />
                  Course Curriculum
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4 px-0'>
                {chapters.map((chapter, idx) => (
                  <div key={chapter.id} className='border-border space-y-2 rounded-lg border p-4'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2'>
                          <Badge variant='outline' className='text-xs'>
                            Chapter {idx + 1}
                          </Badge>
                          <h3 className='font-semibold'>{chapter.name}</h3>
                        </div>
                        {chapter.description && (
                          <p className='text-muted-foreground font-secondary mt-2 text-sm'>
                            {chapter.description}
                          </p>
                        )}
                      </div>
                      <Badge variant='secondary' className='flex-shrink-0'>
                        {chapter.total_lessons} {chapter.total_lessons === 1 ? 'lesson' : 'lessons'}
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
          className='bg-primary/5 border-primary/20 space-y-4 rounded-lg border p-6'
        >
          <h3 className='text-lg font-semibold'>What You&apos;ll Get</h3>
          <div className='space-y-3'>
            <div className='flex items-start gap-3'>
              <CheckCircle2 className='text-primary size-5 flex-shrink-0' />
              <p className='text-sm'>
                Full access to all {course?.total_chapters} chapters and {course?.total_lessons}{' '}
                interactive lessons
              </p>
            </div>
            <div className='flex items-start gap-3'>
              <CheckCircle2 className='text-primary size-5 flex-shrink-0' />
              <p className='text-sm'>
                {invite.isFree
                  ? 'Completely free access with no hidden charges'
                  : `Special ${invite.tierName} access included`}
              </p>
            </div>
            <div className='flex items-start gap-3'>
              <CheckCircle2 className='text-primary size-5 flex-shrink-0' />
              <p className='text-sm'>
                Join a community of learners{' '}
                {invite.cohortName && `in the ${invite.cohortName} cohort`}
              </p>
            </div>
            <div className='flex items-start gap-3'>
              <CheckCircle2 className='text-primary size-5 flex-shrink-0' />
              <p className='text-sm'>
                Learn at your own pace with interactive content and progress tracking
              </p>
            </div>
          </div>
        </motion.div>

        <Separator />

        {/* Footer Note */}
        <p className='text-muted-foreground text-center text-sm'>
          By accepting this invitation, you&apos;ll get immediate access to this course and join the
          learning community.
        </p>

        {/* Spacing for floating CTA */}
        <div className='h-32' />
      </motion.div>

      {/* Floating CTA */}
      {matchingPricingTier && showFloatingCTA && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className='border-border bg-background/95 fixed right-0 bottom-0 left-0 z-50 border-t shadow-lg backdrop-blur-md'
        >
          <motion.div animate={controls} className='mx-auto max-w-4xl px-4 py-3'>
            <PricingOptionCard
              pricingData={matchingPricingTier}
              hideDescription={false}
              hideContinueButton={false}
              enrollUrl='#accept-invite'
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
