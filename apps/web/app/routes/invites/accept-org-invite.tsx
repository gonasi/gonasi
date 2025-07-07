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

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { supabase } = createClient(request);
  const { user } = await getUserProfile(supabase);

  const invite_token = params.token;
  const user_id = user?.id;
  const user_email = user?.email;

  // Validate required parameters
  if (!invite_token || !user_id || !user_email) {
    return data({
      error: {
        message: 'You must be logged in to accept this invitation.',
      },
    });
  }

  // Validate UUID format
  if (!isValidUUID(invite_token)) {
    return data({
      error: {
        message: 'Invalid invitation link format.',
      },
    });
  }

  try {
    const { data: rawData, error } = await supabase.rpc('accept_organization_invite', {
      invite_token,
      user_id,
      user_email,
    });

    const rpcData = rawData as unknown as AcceptOrgInviteResponse;

    console.log('Postgres RPC Response:', { rpcData, error });

    if (error) {
      console.error('Supabase RPC Error:', error);
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

    // Handle function-level errors
    return data({
      error: {
        message: rpcData?.message || 'This invitation is no longer valid.',
        details: rpcData,
      },
    });
  } catch (err) {
    console.error('Unexpected error during invite acceptance:', err);
    return data({
      error: {
        message: 'An unexpected error occurred. Please try again later.',
        details: err,
      },
    });
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

        {/* Show additional error details in development */}
        {process.env.NODE_ENV === 'development' && error?.details && (
          <details className='text-muted-foreground text-left text-sm'>
            <summary className='cursor-pointer font-medium'>Debug Details</summary>
            <pre className='bg-muted mt-2 overflow-auto rounded p-2'>
              {JSON.stringify(error.details, null, 2)}
            </pre>
          </details>
        )}
      </div>

      <div>
        <NavLinkButton to='/' className='w-full sm:w-auto'>
          Go to home
        </NavLinkButton>
      </div>
    </motion.div>
  );
}
