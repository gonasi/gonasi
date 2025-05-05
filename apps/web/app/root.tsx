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
import { getToast } from 'remix-toast';
import { HoneypotProvider } from 'remix-utils/honeypot/react';
import { Toaster } from 'sonner';

import type { Route } from './+types/root';
import { FeedbackBanner } from './components/feedback-banner';
import { Spinner } from './components/loaders';
import { NavigationProgressBar } from './components/progress-bar';
import './app.css';

import { getClientEnv } from '~/.server/env.server';
import { useToast } from '~/components/ui/toast';
import { honeypot } from '~/utils/honeypot.server';
import { combineHeaders } from '~/utils/misc';

export async function loader({ request }: Route.LoaderArgs) {
  const clientEnv = getClientEnv();

  const { toast, headers: toastHeaders } = await getToast(request);
  const honeyProps = await honeypot.getInputProps();

  return data(
    { clientEnv, toast, honeyProps },
    {
      headers: combineHeaders(toastHeaders),
    },
  );
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
  const { toast } = useLoaderData<typeof loader>();
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

      <Outlet />
      <Toaster />
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
