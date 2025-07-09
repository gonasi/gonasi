import { useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router';
import { BadgeDollarSign, BookType, ClipboardList, FileStack } from 'lucide-react';

import type { Route } from './+types/course-index';

import { GoTabNav } from '~/components/go-tab-nav';
import type { OrganizationsOutletContextType } from '~/routes/layouts/organizations/organizations-layout';

export default function CoursesIndex({ params }: Route.ComponentProps) {
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
        to: `${basePath}/files`,
        name: 'Files',
        icon: FileStack,
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
      <div className='bg-background/95 sticky top-0 z-20 border-b'>
        <GoTabNav previousLink={`/${params.organizationId}/builder`} tabs={tabs} />
      </div>
      <div className='mt-4 min-h-screen px-4 md:mt-8'>
        <Outlet context={{ data }} />
      </div>
    </section>
  );
}
