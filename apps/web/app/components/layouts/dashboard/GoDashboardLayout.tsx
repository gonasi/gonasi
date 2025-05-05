import type { PropsWithChildren } from 'react';

import { GoSidebar } from '~/components/go-sidebar';
import type {
  UserActiveCompanyLoaderReturnType,
  UserProfileLoaderReturnType,
  UserRoleLoaderReturnType,
} from '~/root';

interface Props extends PropsWithChildren {
  role: UserRoleLoaderReturnType;
  activeCompany: UserActiveCompanyLoaderReturnType;
  user: UserProfileLoaderReturnType;
}

export function GoDashboardLayout({ role, user, children, activeCompany }: Props) {
  return (
    <div className='container mx-auto flex h-screen overflow-hidden'>
      <div className='w-fit overflow-scroll md:w-40 lg:w-xs'>
        <GoSidebar user={user} role={role} activeCompany={activeCompany} />
      </div>
      <main className='relative flex-1 overflow-y-auto p-4 md:p-8'>{children}</main>
    </div>
  );
}
