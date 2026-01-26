import { data, redirect } from 'react-router';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

import { fetchCohortById } from '@gonasi/database/cohorts';
import { fetchCourseInviteDetails, validateCourseInvite } from '@gonasi/database/courseInvites';
import { getUserProfile } from '@gonasi/database/profile';

import type { Route } from './+types/accept-course-invite';
import { CourseInviteCard, InviteErrorCard } from './components';

import { PlainAvatar } from '~/components/avatars';
import { NavLinkButton } from '~/components/ui/button';
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
  const courseDetails = await fetchCourseInviteDetails(
    supabaseAdmin,
    result.data!.publishedCourseId,
  );

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
    user,
  });
};

export default function AcceptCourseInvite({ loaderData }: Route.ComponentProps) {
  // Show error state if there's an error
  if ('error' in loaderData) {
    return (
      <InviteErrorCard
        message={loaderData.error?.message || 'This invitation is no longer valid.'}
      />
    );
  }

  const { invite, user } = loaderData;

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

        {/* Action Buttons */}
        <div className='flex flex-col gap-3 sm:flex-row'>
          <NavLinkButton to='/' variant='ghost' className='flex-1'>
            Maybe Later
          </NavLinkButton>
          <NavLinkButton to='#' className='flex-1'>
            <CheckCircle2 className='size-4' />
            Accept Invitation
          </NavLinkButton>
        </div>

        {/* Footer Note */}
        <p className='text-muted-foreground text-center text-sm'>
          By accepting this invitation, you&apos;ll get access to this course and join the learning
          community.
        </p>
      </motion.div>
    </div>
  );
}
