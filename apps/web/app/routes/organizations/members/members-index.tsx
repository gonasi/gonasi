import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router';
import { MailPlus, Users } from 'lucide-react';

import type { Route } from './+types/members-index';

import { GoTabNav, type Tab } from '~/components/go-tab-nav';
import type { OrganizationsOutletContextType } from '~/routes/layouts/organizations/organizations-layout';

export default function AllMembers({ params }: Route.ComponentProps) {
  const { data } = useOutletContext<OrganizationsOutletContextType>();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const basePath = `/${params.organizationId}/members`;

    if (location.pathname === basePath) {
      navigate(`${basePath}/active-members`, { replace: true });
    }
  }, [location.pathname, params.organizationId, navigate, data.member.role]);

  return (
    <>
      <section className='container mx-auto px-4 md:px-0'>
        <div className='bg-background/95 sticky -top-10 z-10'>
          <GoTabNav
            tabs={
              [
                {
                  to: `/${params.organizationId}/members/active-members`,
                  name: 'Members',
                  icon: Users,
                },
                data.member.role !== 'editor'
                  ? {
                      to: `/${params.organizationId}/members/invites`,
                      name: 'Invites',
                      icon: MailPlus,
                    }
                  : null,
              ].filter(Boolean) as Tab[]
            }
          />
        </div>
        {/* Main content */}
        <div className='mt-4 md:mt-8'>
          <Outlet context={{ data }} />
        </div>
      </section>
    </>
  );
}
