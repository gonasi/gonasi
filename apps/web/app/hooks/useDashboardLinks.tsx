import {
  HardDrive,
  HomeIcon,
  LayoutTemplateIcon,
  LineChart,
  type LucideIcon,
  Radio,
  SettingsIcon,
  ShieldIcon,
} from 'lucide-react';

import type { OrganizationRolesEnumTypes } from '@gonasi/schemas/organizations';

export interface DashboardLink {
  name: string;
  to: string;
  icon: LucideIcon;
  roles: OrganizationRolesEnumTypes[];
}

export function useDashboardLinks({
  organizationId,
  role,
}: {
  organizationId: string;
  role: OrganizationRolesEnumTypes;
}) {
  const allRoles: OrganizationRolesEnumTypes[] = ['owner', 'admin', 'editor'];

  const analyticsRoles: OrganizationRolesEnumTypes[] = ['owner', 'admin'];

  const DASHBOARD_LINKS: DashboardLink[] = [
    { name: 'Dashboard', to: `/${organizationId}/dashboard`, icon: HomeIcon, roles: allRoles },
    {
      name: 'Members',
      to: `/${organizationId}/members`,
      icon: ShieldIcon,
      roles: allRoles,
    },
    {
      name: 'Financial Activity',
      to: `/${organizationId}/financial-activity`,
      icon: LineChart,
      roles: analyticsRoles,
    },
    {
      name: 'Builder',
      to: `/${organizationId}/builder`,
      icon: LayoutTemplateIcon,
      roles: allRoles,
    },
    {
      name: 'Live Sessions',
      to: `/${organizationId}/live-sessions`,
      icon: Radio,
      roles: allRoles,
    },
    // {
    //   name: 'Analytics',
    //   to: `/${organizationId}/analytics`,
    //   icon: BarChart2Icon,
    //   roles: analyticsRoles,
    // },
    {
      name: 'Storage',
      to: `/${organizationId}/storage`,
      icon: HardDrive,
      roles: allRoles,
    },
    {
      name: 'Settings',
      to: `/${organizationId}/settings`,
      icon: SettingsIcon,
      roles: allRoles,
    },
  ];

  return DASHBOARD_LINKS.filter((link) => link.roles.includes(role));
}
