import { useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { MailPlus, Users, UsersRound } from 'lucide-react';

import type { Route } from './+types/learners-index';

import { GoTabNav } from '~/components/go-tab-nav';
import { Modal } from '~/components/ui/modal';

export function meta() {
  return [
    { title: 'Learners • Gonasi' },
    { name: 'description', content: 'Manage learners, cohorts, and invites for your course' },
  ];
}

export default function LearnersIndex({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const closeRoute = `/${params.organizationId}/builder/${params.courseId}/published`;

  const basePath = useMemo(
    () => `/${params.organizationId}/builder/${params.courseId}/published/learners`,
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
        icon: UsersRound,
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
      <Modal.Content size='lg'>
        <Modal.Header closeRoute={closeRoute} />
        <Modal.Body className='p-0'>
          <div className='flex flex-col'>
            <div className='bg-background/95 sticky top-0 z-20 px-6 pt-4'>
              <GoTabNav tabs={tabs} />
            </div>
            <div className='px-6 pt-4 pb-6'>
              <Outlet />
            </div>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
