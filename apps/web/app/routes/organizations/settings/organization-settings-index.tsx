import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router';
import { Building, Lock } from 'lucide-react';

import type { Route } from './+types/organization-settings-index';

import { SideLink } from '~/components/go-sidebar/side-link';
import type {
  MemberLoaderData,
  OrganizationLoaderData,
} from '~/routes/layouts/organizations/organizations-layout';

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
  const { organization, member } = useOutletContext<{
    organization: OrganizationLoaderData;
    member: MemberLoaderData;
  }>();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const basePath = `/${params.organizationId}/settings`;

    // Only redirect if we're exactly on the base path
    if (location.pathname === basePath) {
      if (member.role === 'admin' || member.role === 'owner') {
        navigate(`${basePath}/organization-profile`, { replace: true });
      } else {
        navigate(`/${params.organizationId}`, { replace: true });
      }
    }
  }, [location.pathname, member.role, params.organizationId, navigate]);

  const links = [
    {
      name: 'Org Profile',
      to: `/${params.organizationId}/settings/organization-profile`,
      icon: Building,
    },
    {
      name: 'Login & Security',
      to: `/${params.organizationId}/settings/organization-security`,
      icon: Lock,
    },
  ];

  return (
    <div className='mx-auto flex'>
      <aside className='border-r-border/50 sticky h-full min-h-screen w-fit flex-none border-r pl-0 md:w-48 md:pl-2 lg:w-56'>
        {links.map(({ name, to, icon }) => (
          <SideLink key={to} to={to} name={name} icon={icon} end />
        ))}
      </aside>

      <section className='w-full py-8 pr-4 lg:pr-0'>
        <div>
          <Outlet context={{ organization, member }} />
        </div>
      </section>
    </div>
  );
}
