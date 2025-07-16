import { useEffect, useMemo } from 'react';
import { data, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router';
import {
  BadgeDollarSign,
  BookType,
  CheckCircle,
  ClipboardList,
  FileStack,
  Pen,
  PencilOff,
} from 'lucide-react';

import type { Route } from './+types/course-index';

import { GoTabNav } from '~/components/go-tab-nav';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { createClient } from '~/lib/supabase/supabase.server';
import type { OrganizationsOutletContextType } from '~/routes/layouts/organizations/organizations-layout';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const courseId = params.courseId ?? '';

  const canEdit = await supabase.rpc('can_user_edit_course', {
    arg_course_id: courseId,
  });

  return data({ canEdit: canEdit.data });
}

export default function CoursesIndex({ params, loaderData }: Route.ComponentProps) {
  const { data } = useOutletContext<OrganizationsOutletContextType>();

  const navigate = useNavigate();
  const location = useLocation();

  const basePath = useMemo(
    () => `/${params.organizationId}/builder/${params.courseId}`,
    [params.organizationId, params.courseId],
  );

  const tabs = useMemo(
    () => [
      {
        to: `${basePath}/published`,
        name: 'Published',
        icon: CheckCircle,
      },
      {
        to: `${basePath}/overview`,
        name: 'Overview',
        icon: ClipboardList,
      },
      {
        to: `${basePath}/pricing`,
        name: 'Pricing',
        icon: BadgeDollarSign,
      },
      {
        to: `${basePath}/content`,
        name: 'Content',
        icon: BookType,
      },
      {
        to: `${basePath}/file-library`,
        name: 'Files',
        icon: FileStack,
      },
    ],
    [basePath],
  );

  useEffect(() => {
    if (location.pathname === basePath) {
      navigate(`${basePath}/published`, { replace: true });
    }
  }, [location.pathname, basePath, navigate]);

  return (
    <section className='container mx-auto px-0'>
      <div className='bg-background/95 sticky top-0 z-20'>
        <GoTabNav
          previousLink={`/${params.organizationId}/builder`}
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
                    ? 'You can make edits to this course'
                    : 'You cannot make edits to this course'}
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
