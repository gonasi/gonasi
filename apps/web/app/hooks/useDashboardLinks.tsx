import {
  BarChart2Icon,
  BookOpenIcon,
  FolderIcon,
  HomeIcon,
  type LucideIcon,
  PencilIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
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

  const creatorRoles: OrganizationRolesEnumTypes[] = ['owner', 'admin', 'editor'];

  const editorRoles: OrganizationRolesEnumTypes[] = ['editor'];

  const learnerRoles: OrganizationRolesEnumTypes[] = ['owner', 'admin'];

  const analyticsRoles: OrganizationRolesEnumTypes[] = ['owner', 'admin'];

  const libraryRoles: OrganizationRolesEnumTypes[] = ['owner', 'admin', 'editor'];

  const adminOnly: OrganizationRolesEnumTypes[] = ['owner', 'admin'];

  const DASHBOARD_LINKS: DashboardLink[] = [
    { name: 'Dashboard', to: `/${organizationId}/dashboard`, icon: HomeIcon, roles: allRoles },
    {
      name: 'Members',
      to: `/${organizationId}/members`,
      icon: ShieldIcon,
      roles: allRoles,
    },
    {
      name: 'Courses',
      to: `/${organizationId}/courses`,
      icon: BookOpenIcon,
      roles: creatorRoles,
    },
    {
      name: 'My Courses',
      to: `/${organizationId}/my-courses`,
      icon: PencilIcon,
      roles: editorRoles,
    },
    {
      name: 'Learners',
      to: `/${organizationId}/learners`,
      icon: UsersIcon,
      roles: learnerRoles,
    },
    {
      name: 'Analytics',
      to: `/${organizationId}/analytics`,
      icon: BarChart2Icon,
      roles: analyticsRoles,
    },
    {
      name: 'Library',
      to: `/${organizationId}/library`,
      icon: FolderIcon,
      roles: libraryRoles,
    },
    {
      name: 'Settings',
      to: `/${organizationId}/settings`,
      icon: SettingsIcon,
      roles: adminOnly,
    },
  ];

  return DASHBOARD_LINKS.filter((link) => link.roles.includes(role));
}
