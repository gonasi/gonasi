import { data, redirect } from 'react-router';
import { motion } from 'framer-motion';
import { redirectWithError, redirectWithSuccess } from 'remix-toast';

import { getUserProfile } from '@gonasi/database/profile';

import type { Route } from './+types/accept-org-invite';

import { AppLogo } from '~/components/app-logo';
import { NavLinkButton } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';

interface AcceptOrgInviteResponse {
  success: boolean;
  message: string;
  data?: {
    organization_id: string;
    organization_name?: string;
    role: string;
    user_id: string;
    joined_at: string;
  };
  error_code?: string;
  error_message?: string;
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { supabase } = createClient(request);
  const { user } = await getUserProfile(supabase);

  const token = params.token;

  if (!token) return redirect('/');

  // Clear the cookie on every response (just to avoid dangling tokens)
  const clearCookieHeader = {
    'Set-Cookie': 'organizationInviteToken=; Max-Age=0; Path=/',
  };

  if (!user?.id || !user?.email) {
    return redirectWithError('/login', 'You need to sign up or log in to continue.', {
      headers: clearCookieHeader,
    });
  }

  if (!isValidUUID(token)) {
    return data(
      { error: { message: 'Invalid invitation token format.' } },
      { headers: clearCookieHeader },
    );
  }

  try {
    const { data: rawData, error } = await supabase.rpc('accept_organization_invite', {
      invite_token: token,
      user_id: user.id,
      user_email: user.email,
    });

    const rpcData = rawData as unknown as AcceptOrgInviteResponse;

    if (error) {
      return data(
        { error: { message: 'Server error.', details: error } },
        { headers: clearCookieHeader },
      );
    }

    if (rpcData?.success) {
      return redirectWithSuccess(
        `/${rpcData?.data?.organization_id}/dashboard`,
        rpcData.message || "You've successfully joined the organization!",
        { headers: clearCookieHeader },
      );
    }

    return data(
      {
        error: {
          message: rpcData?.message || 'This invitation is no longer valid.',
          details: rpcData,
        },
      },
      { headers: clearCookieHeader },
    );
  } catch (err) {
    return data(
      {
        error: {
          message: 'Unexpected error occurred.',
          details: err,
        },
      },
      { headers: clearCookieHeader },
    );
  }
};

export default function AcceptOrgInvite({ loaderData }: Route.ComponentProps) {
  const { error } = loaderData;

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
          {error?.message || 'This invitation is no longer valid.'}
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
