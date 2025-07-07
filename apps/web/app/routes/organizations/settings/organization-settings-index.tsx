import { useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router';
import { Building, Lock, ShieldAlert } from 'lucide-react';

import type { Route } from './+types/organization-settings-index';

import { SideLink } from '~/components/go-sidebar/side-link';
import type { OrganizationsOutletContextType } from '~/routes/layouts/organizations/organizations-layout';

export function meta() {
  return [
    { title: 'Profile Settings • Gonasi' },
    {
      name: 'description',
      content: 'Manage your profile details, visibility, and account preferences on Gonasi.',
    },
  ];
}

export default function OrganizationSettingsIndex({ params }: Route.ComponentProps) {
  const { data } = useOutletContext<OrganizationsOutletContextType>();
  const { member } = data;

  const navigate = useNavigate();
  const location = useLocation();
  const basePath = `/${params.organizationId}/settings`;

  useEffect(() => {
    if (location.pathname === basePath) {
      const defaultPage = member.role === 'editor' ? 'organization-danger' : 'organization-profile';
      navigate(`${basePath}/${defaultPage}`, { replace: true });
    }
  }, [location.pathname, basePath, navigate, member.role]);

  const links = useMemo(() => {
    return [
      {
        name: 'Org Profile',
        to: `${basePath}/organization-profile`,
        icon: Building,
        roles: ['admin', 'owner'],
      },
      {
        name: 'Login & Security',
        to: `${basePath}/organization-security`,
        icon: Lock,
        roles: ['owner'],
      },
      {
        name: 'Danger',
        to: `${basePath}/organization-danger`,
        icon: ShieldAlert,
        roles: ['editor', 'admin', 'owner'],
      },
    ].filter((link) => link.roles.includes(member.role));
  }, [basePath, member.role]);

  return (
    <div className='mx-auto flex'>
      <aside className='border-r-border/50 sticky h-full min-h-screen w-fit flex-none border-r pl-0 md:w-48 md:pl-2 lg:w-56'>
        {links.map(({ name, to, icon }) => (
          <SideLink key={to} to={to} name={name} icon={icon} end />
        ))}
      </aside>

      <section className='w-full py-8 pr-4 lg:pr-0'>
        <Outlet context={{ data }} />
      </section>
    </div>
  );
}
