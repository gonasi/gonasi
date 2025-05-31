import { Outlet, useOutletContext } from 'react-router';

import type { AppOutletContext } from '~/root';

export default function ProfileLayout() {
  const { user, role, activeCompany } = useOutletContext<AppOutletContext>();

  return <Outlet />;
}
