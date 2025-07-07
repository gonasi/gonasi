import {
  BarChart2Icon,
  HomeIcon,
  LayoutTemplateIcon,
  LibraryIcon,
  type LucideIcon,
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
      name: 'Published',
      to: `/${organizationId}/published`,
      icon: LibraryIcon,
      roles: allRoles,
    },
    {
      name: 'Builder',
      to: `/${organizationId}/builder`,
      icon: LayoutTemplateIcon,
      roles: allRoles,
    },
    {
      name: 'Analytics',
      to: `/${organizationId}/analytics`,
      icon: BarChart2Icon,
      roles: analyticsRoles,
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
