import { useOutletContext } from 'react-router';

import type { AppOutletContext } from '~/root';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export default function Dashboard() {
  const { activeCompany } = useOutletContext<AppOutletContext>();

  return (
    <div>
      <h1>{activeCompany?.profiles.full_name}</h1>
      <h4>{activeCompany?.staff_role}</h4>
    </div>
  );
}
