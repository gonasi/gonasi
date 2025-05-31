import { Outlet, useOutletContext } from 'react-router';

import { Spinner } from '~/components/loaders';
import { TopNav } from '~/components/navigation/top-nav';
import { useAuthGuard } from '~/hooks/useAuthGuard';
import type { AppOutletContext } from '~/root';

export default function GoLayout() {
  const { isLoading } = useAuthGuard();
  const { activeCompany } = useOutletContext<AppOutletContext>();

  if (isLoading) return <Spinner />;

  return (
    <>
      <TopNav activeCompany={activeCompany} />
      <Outlet />
    </>
  );
}
