import { useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router';
import { MailPlus, Users } from 'lucide-react';

import type { Route } from './+types/members-index';

import { GoTabNav, type Tab } from '~/components/go-tab-nav';
import type { OrganizationsOutletContextType } from '~/routes/layouts/organizations/organizations-layout';

export default function AllMembers({ params }: Route.ComponentProps) {
  const { data } = useOutletContext<OrganizationsOutletContextType>();
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = useMemo(() => `/${params.organizationId}/members`, [params.organizationId]);

  const tabs: Tab[] = useMemo(() => {
    const result: (Tab | null)[] = [
      {
        to: `${basePath}/active-members`,
        name: 'Members',
        icon: Users,
      },
    ];

    if (data.member.role !== 'editor') {
      result.push({
        to: `${basePath}/invites`,
        name: 'Invites',
        icon: MailPlus,
      });
    }

    return result.filter(Boolean) as Tab[];
  }, [basePath, data.member.role]);

  useEffect(() => {
    if (location.pathname === basePath) {
      navigate(`${basePath}/active-members`, { replace: true });
    }
  }, [location.pathname, basePath, navigate]);

  return (
    <section className='container mx-auto px-4 md:px-0'>
      <div className='bg-background/95 sticky -top-10 z-10'>
        <GoTabNav tabs={tabs} />
      </div>
      <div className='mt-4 md:mt-8'>
        <Outlet context={{ data }} />
      </div>
    </section>
  );
}
