import { Outlet, useOutletContext } from 'react-router';

import { TopNav } from '~/components/go-top-nav';
import type { AppOutletContext } from '~/root';

export default function MainLayout() {
  const { user, role, activeCompany } = useOutletContext<AppOutletContext>();

  return (
    <div>
      <TopNav
        user={user ?? undefined}
        role={user ? role : undefined}
        activeCompany={user ? activeCompany : null}
      />
      <section className='container mx-auto'>
        <Outlet />
      </section>
    </div>
  );
}
