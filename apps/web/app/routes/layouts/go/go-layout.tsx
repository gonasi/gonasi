import { data, Outlet, redirect } from 'react-router';
import { jwtDecode, type JwtPayload } from 'jwt-decode';

import { fetchAllUsersActiveCompany } from '@gonasi/database/activeCompany';
import type { UserRole } from '@gonasi/database/client';
import { getUserProfile } from '@gonasi/database/profile';

import type { Route } from './+types/go-layout';

import { TopNav } from '~/components/go-top-nav';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [
    { title: 'Gonasi - Build & Play Interactive Courses' },
    {
      name: 'description',
      content:
        'Create gamified, interactive courses effortlessly with Gonasi. No coding required. Engage learners with dynamic plugins, quizzes, and simulations.',
    },
    {
      name: 'keywords',
      content:
        'interactive learning, no-code course builder, gamified education, e-learning platform, online courses, drag-and-drop learning',
    },
    { property: 'og:title', content: 'Gonasi - No-Code Interactive Course Builder' },
    {
      property: 'og:description',
      content:
        'Empower educators to design interactive, gamified lessons like Duolingo or Brilliant—without writing code.',
    },
    { property: 'og:image', content: 'https://gonasi.com/og-image.jpg' },
    { property: 'og:url', content: 'https://gonasi.com' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Gonasi - No-Code Interactive Course Builder' },
    {
      name: 'twitter:description',
      content: 'Drag and drop interactive learning elements, quizzes, and games. No coding needed.',
    },
    { name: 'twitter:image', content: 'https://gonasi.com/twitter-image.jpg' },
  ];
}

export interface GoJwtPayload extends JwtPayload {
  user_role: UserRole;
}

export type UserActiveCompanyLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data']['activeCompany'];

export type UserProfileLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data']['user'];

export type UserRoleLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data']['role'];

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const { user } = await getUserProfile(supabase);

  if (!user) {
    return redirect(
      `/login?${new URLSearchParams({ redirectTo: new URL(request.url).pathname + new URL(request.url).search })}`,
    );
  }

  if (user?.is_onboarding_complete === false) {
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;

    return redirect(
      `/onboarding/${user.id}/basic-information?${new URLSearchParams({ redirectTo })}`,
    );
  }

  let role = 'user';

  const [activeCompany, sessionResult] = await Promise.all([
    fetchAllUsersActiveCompany(supabase),
    supabase.auth.getSession(),
  ]);

  if (sessionResult.data.session) {
    const { user_role }: GoJwtPayload = jwtDecode(sessionResult.data.session.access_token);
    role = user_role;
  }

  return data({ activeCompany, role, user });
}

export default function GoLayout({ loaderData }: Route.ComponentProps) {
  const { activeCompany, role, user } = loaderData;

  return (
    <>
      <TopNav user={user} role={role} activeCompany={activeCompany} />
      <Outlet />
    </>
  );
}
