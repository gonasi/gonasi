import { data, redirect } from 'react-router';
import { motion } from 'framer-motion';

import { validateCourseInvite } from '@gonasi/database/courseInvites';
import { getUserProfile } from '@gonasi/database/profile';

import type { Route } from './+types/accept-course-invite';

import { AppLogo } from '~/components/app-logo';
import { NavLinkButton } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';

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
    },
  });
};

export default function AcceptCourseInvite({ loaderData }: Route.ComponentProps) {
  // Show error state if there's an error
  if ('error' in loaderData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className='mx-auto mt-24 max-w-md space-y-8 px-6 text-center'
      >
        <div className='flex justify-center'>
          <AppLogo />
        </div>

        <div className='space-y-4'>
          <p className='text-danger font-secondary text-lg font-semibold'>
            {loaderData.error?.message || 'This invitation is no longer valid.'}
          </p>
        </div>

        <div>
          <NavLinkButton to='/' className='w-full sm:w-auto'>
            Go to home
          </NavLinkButton>
        </div>
      </motion.div>
    );
  }

  const { invite } = loaderData;

  // Success state - show invite details and accept button
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className='mx-auto mt-24 max-w-md space-y-8 px-6'
    >
      <div className='flex justify-center'>
        <AppLogo />
      </div>

      <div className='space-y-6'>
        <div className='text-center'>
          <h1 className='font-secondary text-2xl font-semibold'>Course Invitation</h1>
          <p className='text-muted-foreground mt-2'>You&apos;ve been invited to join a course</p>
        </div>

        <div className='bg-muted/50 space-y-4 rounded-lg p-6'>
          <div>
            <p className='text-muted-foreground text-sm'>Course</p>
            <p className='text-lg font-semibold'>{invite.courseName}</p>
          </div>

          <div>
            <p className='text-muted-foreground text-sm'>Organization</p>
            <p className='font-medium'>{invite.organizationName}</p>
          </div>

          <div>
            <p className='text-muted-foreground text-sm'>Pricing</p>
            <p className='font-medium'>
              {invite.isFree ? (
                'Free'
              ) : (
                <>
                  {invite.currencyCode} {Number(invite.price).toLocaleString()} - {invite.tierName}
                </>
              )}
            </p>
          </div>

          <div>
            <p className='text-muted-foreground text-sm'>Invitation expires</p>
            <p className='font-medium'>
              {new Date(invite.expiresAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <div className='flex gap-4'>
          <NavLinkButton to='/' variant='ghost' className='flex-1'>
            Cancel
          </NavLinkButton>
          <NavLinkButton to='#' className='flex-1'>
            Accept Invitation
          </NavLinkButton>
        </div>
      </div>
    </motion.div>
  );
}
