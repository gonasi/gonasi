import { Outlet } from 'react-router';

import { Spinner } from '~/components/loaders';
import { BottomNav } from '~/components/navigation/bottom-nav/bottom-nav';
import { TopNav } from '~/components/navigation/top-nav';
import { useStore } from '~/store';

export default function MainLayout() {
  const { activeUserProfile, isActiveUserProfileLoading } = useStore();

  if (isActiveUserProfileLoading) return <Spinner />;

  return (
    <div>
      <TopNav user={activeUserProfile} />
      <section className='container mx-auto min-h-screen'>
        <Outlet />
      </section>
      <BottomNav user={activeUserProfile} />
    </div>
  );
}
