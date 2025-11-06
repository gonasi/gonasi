import { useEffect } from 'react';
import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigate,
} from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import type { JwtPayload } from 'jwt-decode';
import { jwtDecode } from 'jwt-decode';
import { PostHogProvider } from 'posthog-js/react';
import { getToast } from 'remix-toast';
import { HoneypotProvider } from 'remix-utils/honeypot/react';
import { Toaster } from 'sonner';

import type { UserRole } from '@gonasi/database/client';
import { getUserProfile } from '@gonasi/database/profile';

import type { Route } from './+types/root';
import { NavigationProgressBar } from './components/progress-bar';
import { useStore } from './store';
import './app.css';

import { getClientEnv } from '~/.server/env.server';
import { useToast } from '~/components/ui/toast';
import { createClient } from '~/lib/supabase/supabase.server';
import { honeypot } from '~/utils/honeypot.server';
import { combineHeaders } from '~/utils/misc';

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
};

// --- Types ---
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

export type UserActiveSessionLoaderReturnType = Exclude<
  Awaited<ReturnType<typeof loader>>,
  Response
>['data']['session'];

export interface AppOutletContext {
  user: UserProfileLoaderReturnType;
  role: UserRoleLoaderReturnType;
  session: UserActiveSessionLoaderReturnType;
}

// --- Loader ---
export async function loader({ request }: Route.LoaderArgs) {
  const clientEnv = getClientEnv();
  const { headers: supabaseHeaders, supabase } = createClient(request);

  const { user } = await getUserProfile(supabase);
  const sessionResult = await supabase.auth.getSession();

  let role: UserRole = 'user';
  if (sessionResult.data.session) {
    const decoded: GoJwtPayload = jwtDecode(sessionResult.data.session.access_token);
    role = decoded.user_role;
  }

  const { toast, headers: toastHeaders } = await getToast(request);
  const honeyProps = await honeypot.getInputProps();

  return data(
    {
      clientEnv,
      role,
      user,
      toast,
      honeyProps,
      session: sessionResult.data.session,
    },
    {
      headers: combineHeaders(supabaseHeaders, toastHeaders),
    },
  );
}

export const useClientEnv = () => useLoaderData<typeof loader>().clientEnv;

// --- Font Preloads ---
export const links: Route.LinksFunction = () => [
  ...[
    'Semibold.otf',
    'Bold.ttf',
    'BoldItalic.ttf',
    'Medium.ttf',
    'MediumItalic.ttf',
    'Regular.ttf',
    'SemiBold.ttf',
    'SemiBoldItalic.ttf',
  ].map((name) => ({
    rel: 'preload',
    href: `/assets/fonts/montserrat/Montserrat-${name}`,
    as: 'font',
    type: name.endsWith('.otf') ? 'font/otf' : 'font/ttf',
    crossOrigin: 'anonymous' as 'anonymous', // cast to the exact string literal type
  })),
];

// --- Layout ---
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

// --- App Component ---
function App() {
  const navigate = useNavigate();
  const { user, role, toast, session } = useLoaderData<typeof loader>();
  const { updateActiveSession, updateActiveUserProfile, updateActiveUserRole } = useStore();

  useToast(toast);

  useEffect(() => {
    updateActiveSession(session);
    updateActiveUserRole(role);
  }, [session, role, updateActiveSession, updateActiveUserRole]);

  useEffect(() => {
    updateActiveUserProfile(user);
  }, [updateActiveUserProfile, user]);

  useEffect(() => {
    document.fonts.ready.then(() => {
      document.body.classList.add('fonts-loaded');
    });
  }, []);

  return (
    <main className='relative'>
      <NavigationProgressBar />
      <Outlet />
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

// --- App With Honeypot Provider ---
function AppWithProviders() {
  const { honeyProps } = useLoaderData<typeof loader>();
  return (
    <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={options}>
      <HoneypotProvider {...honeyProps}>
        <App />
      </HoneypotProvider>
    </PostHogProvider>
  );
}

export default AppWithProviders;

// --- Error Boundary ---
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The page you’re looking for could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className='container mx-auto py-10'>
      <h1 className='text-4xl font-bold'>{message}</h1>
      <p className='text-muted-foreground mt-4'>{details}</p>
      {stack && (
        <pre className='text-muted-foreground mt-4 text-sm whitespace-pre-wrap'>{stack}</pre>
      )}
    </main>
  );
}
