import { Outlet, useOutletContext } from 'react-router';
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
  // TODO: Only owner and admin can access - fetch from outlet context user role

  const sections = [
    {
      heading: 'Organization Settings',
      links: [
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
      ],
    },
  ];

  return (
    <div className='mx-auto flex'>
      <aside className='border-r-border/50 sticky h-full min-h-screen w-fit flex-none border-r pl-0 md:w-48 md:pl-2 lg:w-56'>
        {sections.map(({ heading, links }) => (
          <div key={heading}>
            <h2 className='font-secondary hidden py-2 font-semibold md:flex'>{heading}</h2>
            <div className='flex flex-col space-y-4 py-4 md:space-y-1 md:py-1'>
              {links.map(({ name, to, icon }) => (
                <SideLink key={to} to={to} name={name} icon={icon} end />
              ))}
            </div>
          </div>
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
