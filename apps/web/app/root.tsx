import { useEffect, useState } from 'react';
import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
} from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import type { JwtPayload } from 'jwt-decode';
import { jwtDecode } from 'jwt-decode';
import { dataWithError, getToast, redirectWithSuccess } from 'remix-toast';
import { HoneypotProvider } from 'remix-utils/honeypot/react';
import { Toaster } from 'sonner';

import { fetchAllUsersActiveCompany } from '@gonasi/database/activeCompany';
import type { UserRole } from '@gonasi/database/client';
import { getUserProfile } from '@gonasi/database/profile';
import { updateUsersActiveCompany } from '@gonasi/database/staffMembers';

import type { Route } from './+types/root';
import { FeedbackBanner } from './components/feedback-banner';
import { Spinner } from './components/loaders';
import { NavigationProgressBar } from './components/progress-bar';
import './app.css';

import { getClientEnv } from '~/.server/env.server';
import { useToast } from '~/components/ui/toast';
import { createClient } from '~/lib/supabase/supabase.server';
import { honeypot } from '~/utils/honeypot.server';
import { combineHeaders } from '~/utils/misc';

export interface GoJwtPayload extends JwtPayload {
  user_role: UserRole;
}

export type UserProfileLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data']['user'];

export type UserRoleLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data']['role'];

export type UserActiveCompanyLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data']['activeCompany'];

export interface AppOutletContext {
  user: UserProfileLoaderReturnType;
  role: UserRoleLoaderReturnType;
  activeCompany: UserActiveCompanyLoaderReturnType;
}

export async function loader({ request }: Route.LoaderArgs) {
  const clientEnv = getClientEnv();

  const { headers: supabaseHeaders, supabase } = createClient(request);

  let role = 'user';

  const { user } = await getUserProfile(supabase);

  const [activeCompany, sessionResult] = await Promise.all([
    fetchAllUsersActiveCompany(supabase),
    supabase.auth.getSession(),
  ]);

  if (sessionResult.data.session) {
    const { user_role }: GoJwtPayload = jwtDecode(sessionResult.data.session.access_token);
    role = user_role;
  }

  const { toast, headers: toastHeaders } = await getToast(request);
  const honeyProps = await honeypot.getInputProps();

  return data(
    { clientEnv, role, user, activeCompany, toast, honeyProps },
    {
      headers: combineHeaders(supabaseHeaders, toastHeaders),
    },
  );
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  const companyId = formData.get('companyId') as string | null;

  if (!companyId) {
    return dataWithError(null, 'Missing companyId');
  }

  const { supabase } = createClient(request);

  const { success, message, data } = await updateUsersActiveCompany(supabase, companyId);

  return success && data
    ? redirectWithSuccess(`/dashboard/${data.companyId}/team-management/staff-directory`, message)
    : dataWithError(null, message);
}

export const useClientEnv = () => {
  return useLoaderData<typeof loader>().clientEnv;
};

// ✅ Preload & use `font-display: swap` to prevent FOUT
export const links: Route.LinksFunction = () => [
  {
    rel: 'preload',
    href: '/assets/fonts/oceanwide/Oceanwide-Semibold.otf',
    as: 'font',
    type: 'font/otf',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'preload',
    href: '/assets/fonts/montserrat/Montserrat-Bold.ttf',
    as: 'font',
    type: 'font/ttf',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'preload',
    href: '/assets/fonts/montserrat/Montserrat-BoldItalic.ttf',
    as: 'font',
    type: 'font/ttf',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'preload',
    href: '/assets/fonts/montserrat/Montserrat-Medium.ttf',
    as: 'font',
    type: 'font/ttf',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'preload',
    href: '/assets/fonts/montserrat/Montserrat-MediumItalic.ttf',
    as: 'font',
    type: 'font/ttf',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'preload',
    href: '/assets/fonts/montserrat/Montserrat-Regular.ttf',
    as: 'font',
    type: 'font/ttf',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'preload',
    href: '/assets/fonts/montserrat/Montserrat-SemiBold.ttf',
    as: 'font',
    type: 'font/ttf',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'preload',
    href: '/assets/fonts/montserrat/Montserrat-SemiBoldItalic.ttf',
    as: 'font',
    type: 'font/ttf',
    crossOrigin: 'anonymous',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Analytics />
        <SpeedInsights />
        <Scripts />
      </body>
    </html>
  );
}

function App() {
  const { user, role, toast, activeCompany } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [showLoader, setShowLoader] = useState(false);

  useToast(toast);

  // ✅ Fix FOUT by ensuring fonts are loaded before rendering content
  useEffect(() => {
    document.fonts.ready.then(() => {
      document.body.classList.add('fonts-loaded');
    });
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (navigation.location) {
      timeout = setTimeout(() => setShowLoader(true), 200);
    } else {
      setShowLoader(false);
    }

    return () => clearTimeout(timeout);
  }, [navigation.location]);

  return (
    <main className='relative'>
      {showLoader && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'hsla(0, 0%, 0%, 0.5)',
            zIndex: 1000,
          }}
        >
          <Spinner />
        </div>
      )}
      <NavigationProgressBar />
      <FeedbackBanner />

      <Outlet context={{ user, role, activeCompany }} />
      <Toaster
        position='top-right'
        toastOptions={{
          classNames: {
            toast: `
        group toast
        group-[.toaster]:bg-background
        group-[.toaster]:text-foreground
        group-[.toaster]:border-border
        group-[.toaster]:shadow-lg
        rounded-xl px-4 py-3
      `,
            description: 'group-[.toast]:text-muted-foreground',
            actionButton: `
        group-[.toast-success]:bg-[--success]
        group-[.toast-success]:text-[--success-foreground]
        group-[.toast-success]:hover:bg-[--success-hover]

        group-[.toast-error]:bg-[--danger]
        group-[.toast-error]:text-[--danger-foreground]
        group-[.toast-error]:hover:bg-[--danger-hover]

        group-[.toast-warning]:bg-[--warning]
        group-[.toast-warning]:text-[--warning-foreground]
        group-[.toast-warning]:hover:bg-[--warning-hover]

        group-[.toast-info]:bg-[--info]
        group-[.toast-info]:text-[--info-foreground]
        group-[.toast-info]:hover:bg-[--info-hover]

        px-3 py-1 rounded-md font-medium transition-colors
      `,
            cancelButton: `
        group-[.toast]:bg-muted 
        group-[.toast]:text-muted-foreground 
        hover:opacity-80 transition-opacity
      `,
          },
        }}
      />
    </main>
  );
}

function AppWithProviders() {
  const { honeyProps } = useLoaderData<typeof loader>();
  return (
    <HoneypotProvider {...honeyProps}>
      <App />
    </HoneypotProvider>
  );
}

export default AppWithProviders;

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404 ? 'The requested page could not be found.' : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className='container mx-auto p-4 pt-16'>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className='w-full overflow-x-auto p-4'>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

export function HydrateFallback() {
  return <div>Loading...</div>;
}
