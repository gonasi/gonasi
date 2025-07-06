import { data } from 'react-router';
import { redirectWithSuccess } from 'remix-toast';

import type { Route } from './+types/accept-org-invite';

import { createClient } from '~/lib/supabase/supabase.server';

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { supabase } = createClient(request);

  const { data: rpcData, error } = await supabase.functions.invoke('accept-organization-invite', {
    body: { token: params.token },
  });

  console.log('Supabase Function Response:', { rpcData, error });

  // Handle network/connection errors
  if (error) {
    return data({
      error: {
        message: 'Failed to connect to the server. Please try again.',
        details: error,
      },
    });
  }

  // Handle successful invite acceptance
  if (rpcData?.success) {
    return redirectWithSuccess(
      '/dashboard/organizations',
      rpcData.message || "You've successfully joined the organization!",
    );
  }

  // Handle function errors (standardized response format)
  return data({
    error: {
      message: rpcData?.message || 'This invite is no longer valid.',
      details: rpcData,
    },
  });
};

export default function AcceptOrgInvite({ loaderData }: Route.ComponentProps) {
  const { error } = loaderData;

  return (
    <div className='mx-auto mt-20 max-w-md space-y-6 text-center'>
      <p className='text-lg font-semibold text-red-600'>
        {error?.message || 'This invite is no longer valid.'}
      </p>

      <a
        href='/dashboard/organizations'
        className='inline-block rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700'
      >
        Go to Dashboard
      </a>
    </div>
  );
}
