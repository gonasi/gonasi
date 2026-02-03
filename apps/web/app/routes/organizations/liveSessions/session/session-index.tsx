import { useEffect, useMemo } from 'react';
import { data, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router';
import {
  BarChart2,
  ClipboardList,
  LayoutList,
  Pen,
  PencilOff,
  Play,
  Users,
} from 'lucide-react';

import type { Route } from './+types/session-index';

import { GoTabNav } from '~/components/go-tab-nav';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { createClient } from '~/lib/supabase/supabase.server';
import type { OrganizationsOutletContextType } from '~/routes/layouts/organizations/organizations-layout';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const sessionId = params.sessionId ?? '';

  const canEdit = await supabase.rpc('can_user_edit_live_session', {
    arg_session_id: sessionId,
  });

  return data({ canEdit: canEdit.data });
}

export default function SessionIndex({ params, loaderData }: Route.ComponentProps) {
  const { data } = useOutletContext<OrganizationsOutletContextType>();

  const navigate = useNavigate();
  const location = useLocation();

  const basePath = useMemo(
    () => `/${params.organizationId}/live-sessions/${params.sessionId}`,
    [params.organizationId, params.sessionId],
  );

  const tabs = useMemo(
    () => [
      {
        to: `${basePath}/overview`,
        name: 'Overview',
        icon: ClipboardList,
      },
      {
        to: `${basePath}/blocks`,
        name: 'Blocks',
        icon: LayoutList,
      },
      {
        to: `${basePath}/facilitators`,
        name: 'Facilitators',
        icon: Users,
      },
      {
        to: `${basePath}/control`,
        name: 'Control',
        icon: Play,
      },
      {
        to: `${basePath}/analytics`,
        name: 'Analytics',
        icon: BarChart2,
      },
    ],
    [basePath],
  );

  useEffect(() => {
    if (location.pathname === basePath) {
      navigate(`${basePath}/overview`, { replace: true });
    }
  }, [location.pathname, basePath, navigate]);

  return (
    <section className='container mx-auto px-0'>
      <div className='bg-background/95 sticky top-0 z-20'>
        <GoTabNav
          previousLink={`/${params.organizationId}/live-sessions`}
          tabs={tabs}
          endComponent={
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {loaderData.canEdit ? (
                    <Pen size={16} className='text-muted-foreground hidden md:flex' />
                  ) : (
                    <PencilOff size={16} className='text-muted-foreground hidden md:flex' />
                  )}
                </TooltipTrigger>
                <TooltipContent side='top'>
                  {loaderData.canEdit
                    ? 'You can make edits to this session'
                    : 'You cannot make edits to this session'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          }
        />
      </div>
      <div className='mt-4 min-h-screen px-4 md:mt-8'>
        <Outlet context={{ data }} />
      </div>
    </section>
  );
}
