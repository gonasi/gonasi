import { redirect } from 'react-router';
import { serialize } from 'cookie';

import type { Route } from './+types/get-org-token';

export const loader = async ({ params }: Route.LoaderArgs) => {
  const token = params.token;

  if (!token) return redirect('/');

  const cookie = serialize('organizationInviteToken', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 15, // 15 minutes
  });

  return new Response(null, {
    status: 302,
    headers: {
      'Set-Cookie': cookie,
      Location: '/i/org-invites/accept',
    },
  });
};
