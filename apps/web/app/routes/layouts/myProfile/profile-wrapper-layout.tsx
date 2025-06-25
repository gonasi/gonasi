import { Outlet } from 'react-router';

import { ProfileTopNav } from '~/components/navigation/top-nav/profile-top-nav';
import { useStore } from '~/store';

export default function ProfileWrapperLayout() {
  const { activeUserProfile } = useStore();

  return (
    <div>
      <ProfileTopNav user={activeUserProfile} />
      <section className='container mx-auto min-h-screen'>
        <Outlet />
      </section>
    </div>
  );
}
