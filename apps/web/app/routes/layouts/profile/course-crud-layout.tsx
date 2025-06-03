import { Outlet, useOutletContext } from 'react-router';

import type { AppOutletContext } from '~/root';

export default function CourseCrudLayout() {
  const { user, role, activeCompany } = useOutletContext<AppOutletContext>();

  return <Outlet context={{ user, role, activeCompany }} />;
}
