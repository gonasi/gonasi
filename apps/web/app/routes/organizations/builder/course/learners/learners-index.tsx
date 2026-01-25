import { useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { ImageOff, Layers, MailPlus, Users } from 'lucide-react';
import { redirectWithError } from 'remix-toast';

import { fetchCourseTitleAndThumbnailById } from '@gonasi/database/courses';

import type { Route } from './+types/learners-index';

import { GoTabNav } from '~/components/go-tab-nav';
import { Modal } from '~/components/ui/modal';
import createClient from '~/lib/supabase/supabase.server';

export function meta() {
  return [
    { title: 'Learners • Gonasi' },
    { name: 'description', content: 'Manage learners, cohorts, and invites for your course' },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  if (!params.courseId) {
    return redirectWithError(`/${params.organizationId}`, 'Missing course identifier.');
  }

  const course = await fetchCourseTitleAndThumbnailById({
    supabase,
    courseId: params.courseId,
  });

  if (!course) {
    return redirectWithError(
      `/${params.organizationId}/builder/${params.courseId}/published`,
      'We couldn’t find that course.',
    );
  }

  return course;
}

export default function LearnersIndex({ params, loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const closeRoute = `/${params.organizationId}/builder/${params.courseId}/published`;

  const basePath = useMemo(
    () => `/${params.organizationId}/builder/${params.courseId}/learners`,
    [params.organizationId, params.courseId],
  );

  const tabs = useMemo(
    () => [
      {
        to: `${basePath}/all`,
        name: 'Learners',
        icon: Users,
      },
      {
        to: `${basePath}/cohorts`,
        name: 'Cohorts',
        icon: Layers,
      },
      {
        to: `${basePath}/invites`,
        name: 'Invites',
        icon: MailPlus,
      },
    ],
    [basePath],
  );

  useEffect(() => {
    if (location.pathname === basePath) {
      navigate(`${basePath}/all`, { replace: true });
    }
  }, [location.pathname, basePath, navigate]);

  return (
    <Modal open>
      <Modal.Content size='full'>
        <Modal.Header
          closeRoute={closeRoute}
          title={loaderData.name}
          className='container mx-auto px-4 md:px-0'
          leadingIcon={
            loaderData.signedUrl ? (
              <img
                alt={loaderData.name}
                src={loaderData.signedUrl}
                className='h-10 rounded-xs object-cover'
              />
            ) : (
              <div className='bg-muted flex h-10 w-10 items-center justify-center rounded-xs'>
                <ImageOff className='text-muted-foreground h-5 w-5' />
              </div>
            )
          }
        />
        <Modal.Body className='container mx-auto px-4 md:px-0'>
          <div className='flex flex-col'>
            <div className='bg-background/95 sticky top-0 z-20'>
              <GoTabNav tabs={tabs} />
            </div>
            <div className='py-4'>
              <Outlet />
            </div>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
