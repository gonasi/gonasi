import { Outlet } from 'react-router';
import { Plus } from 'lucide-react';

import type { Route } from './+types/builder-index';

import { IconNavLink } from '~/components/ui/button';

export default function BuilderIndex({ params }: Route.ComponentProps) {
  return (
    <>
      <div className='container mx-auto p-4'>
        <div className='flex items-center justify-between px-0 md:px-4'>
          <h2 className='text-lg md:text-2xl'>Manage Courses</h2>
          <IconNavLink
            to={`/${params.organizationId}/builder/new-course-title`}
            icon={Plus}
            className='rounded-lg border p-2'
          />
        </div>
      </div>
      <Outlet />
    </>
  );
}
