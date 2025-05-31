import { Outlet, useOutletContext } from 'react-router';

import { BottomNav } from '~/components/navigation/bottom-nav/bottom-nav';
import { TopNav } from '~/components/navigation/top-nav';
import type { AppOutletContext } from '~/root';

export default function ProfileLayout() {
  const { user, role, activeCompany } = useOutletContext<AppOutletContext>();

  return (
    <div>
      <TopNav
        user={user ?? undefined}
        role={user ? role : undefined}
        activeCompany={user ? activeCompany : null}
      />
      <section className='container mx-auto min-h-screen'>
        <Outlet />
      </section>
      <BottomNav user={user ?? undefined} />
    </div>
  );
}
