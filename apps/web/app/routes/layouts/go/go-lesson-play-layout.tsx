import { Outlet } from 'react-router';

import { Spinner } from '~/components/loaders';
import { useAuthGuard } from '~/hooks/useAuthGuard';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export default function GoLessonPlayLayout() {
  // TODO: Check if user can play
  const { isLoading } = useAuthGuard();

  if (isLoading) return <Spinner />;
  return <Outlet />;
}
