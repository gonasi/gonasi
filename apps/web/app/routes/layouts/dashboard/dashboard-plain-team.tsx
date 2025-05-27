import { Outlet, useOutletContext } from 'react-router';

import { Spinner } from '~/components/loaders';
import { useAuthGuard } from '~/hooks/useAuthGuard';
import type { AppOutletContext } from '~/root';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export default function DashboardPlainTeamLayout() {
  const { isLoading, user } = useAuthGuard();
  const { role, activeCompany } = useOutletContext<AppOutletContext>();

  if (isLoading) return <Spinner />;

  return (
    <section className='mx-auto max-w-lg md:mt-16'>
      <Outlet context={{ user, role, activeCompany }} />
    </section>
  );
}
