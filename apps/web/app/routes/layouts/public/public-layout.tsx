import { Outlet, useOutletContext } from 'react-router';

import { TopNav } from '~/components/navigation/top-nav';
import type { AppOutletContext } from '~/root';

export default function PublicLayout() {
  const { user, activeCompany } = useOutletContext<AppOutletContext>();

  return (
    <div>
      <TopNav activeCompany={user ? activeCompany : null} />
      <section className='container mx-auto'>
        <Outlet />
      </section>
    </div>
  );
}
