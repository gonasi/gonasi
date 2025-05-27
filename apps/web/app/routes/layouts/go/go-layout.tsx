import { Outlet, useOutletContext } from 'react-router';

import { TopNav } from '~/components/go-top-nav';
import { Spinner } from '~/components/loaders';
import { useAuthGuard } from '~/hooks/useAuthGuard';
import type { AppOutletContext } from '~/root';

export default function GoLayout() {
  const { isLoading, user } = useAuthGuard();
  const { role, activeCompany } = useOutletContext<AppOutletContext>();

  if (isLoading) return <Spinner />;

  return (
    <>
      <TopNav user={user} role={role} activeCompany={activeCompany} />
      <Outlet />
    </>
  );
}
