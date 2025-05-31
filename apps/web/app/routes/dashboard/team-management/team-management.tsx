import { useEffect } from 'react';
import { Outlet, useNavigate, useOutletContext } from 'react-router';
import { Library } from 'lucide-react';

import type { Route } from './+types/team-management';

import { GoTabNav } from '~/components/go-tab-nav';
import type { AppOutletContext } from '~/root';

export function meta() {
  return [
    { title: 'Team Management - Gonasi' },
    { name: 'description', content: 'Explore detailed information about this course on Gonasi.' },
  ];
}

export default function TeamManagement({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { user, role, activeCompany } = useOutletContext<AppOutletContext>();

  useEffect(() => {
    navigate(`/dashboard/${params.companyId}/team-management/staff-directory`);
  }, [navigate, params.companyId]);

  return (
    <section className='h-full'>
      {/* Sticky tab navigation */}
      <div className='bg-background/95 sticky -top-10 z-10'>
        <GoTabNav
          tabs={[
            {
              to: `/dashboard/${params.companyId}/team-management/staff-directory`,
              name: 'Staff Directory',
              icon: Library,
            },
            {
              to: `/dashboard/${params.companyId}/team-management/staff-teams`,
              name: 'Staff Teams',
              icon: Library,
            },
            {
              to: `/dashboard/${params.companyId}/team-management/staff-invites`,
              name: 'Staff Invites',
              icon: Library,
            },
          ]}
        />
      </div>
      {/* Main content */}
      <div className='mt-4 md:mt-8'>
        <Outlet context={{ user, role, activeCompany }} />
      </div>
    </section>
  );
}
