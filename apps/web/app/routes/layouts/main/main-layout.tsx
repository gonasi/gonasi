import { Outlet, useOutletContext } from 'react-router';

import { BottomNav } from '~/components/navigation/bottom-nav/bottom-nav';
import { TopNav } from '~/components/navigation/top-nav';
import type { AppOutletContext } from '~/root';

export default function MainLayout() {
  const { user, role, activeCompany } = useOutletContext<AppOutletContext>();

  return (
    <div>
      <TopNav activeCompany={user ? activeCompany : null} />
      <section className='container mx-auto min-h-screen'>
        <Outlet context={{ user, role, activeCompany }} />
      </section>
      <BottomNav activeCompany={user ? activeCompany : null} />
    </div>
  );
}
