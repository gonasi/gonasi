import { data } from 'react-router';
import { motion } from 'framer-motion';
import { redirectWithSuccess } from 'remix-toast';

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
    role: string;
    user_id: string;
    joined_at: string;
  };
}

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { supabase } = createClient(request);
  const { user } = await getUserProfile(supabase);

  const invite_token = params.token;
  const user_id = user?.id;
  const user_email = user?.email;

  if (!invite_token || !user_id || !user_email) {
    return data({
      error: {
        message: 'You must be logged in to accept this invitation.',
      },
    });
  }

  const { data: rawData, error } = await supabase.rpc('accept_organization_invite', {
    invite_token,
    user_id,
    user_email,
  });

  const rpcData = rawData as unknown as AcceptOrgInviteResponse;

  console.log('Postgres RPC Response:', { rpcData, error });

  if (error) {
    return data({
      error: {
        message: 'Unable to reach the server. Please try again later.',
        details: error,
      },
    });
  }

  if (rpcData?.success) {
    return redirectWithSuccess(
      `/go/${user.username}/organizations`,
      rpcData.message || "You've successfully joined the organization!",
    );
  }

  return data({
    error: {
      message: rpcData?.message || 'This invitation is no longer valid.',
      details: rpcData,
    },
  });
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

      <p className='text-danger font-secondary text-lg font-semibold'>
        {error?.message || 'This invitation is no longer valid.'}
      </p>

      <div>
        <NavLinkButton to='/' className='w-full sm:w-auto'>
          Go to home
        </NavLinkButton>
      </div>
    </motion.div>
  );
}
