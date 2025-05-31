import { NavLink, useLocation } from 'react-router';
import {
  BookLock,
  BookOpen,
  BookOpenCheck,
  ChevronLeft,
  ChevronsUpDown,
  ClipboardCheck,
  Coins,
  FileStack,
  Group,
  LayoutDashboard,
  TableOfContents,
  UsersRound,
} from 'lucide-react';

import { isGoSuOrGoAdmin, isGoSuOrGoAdminOrGoStaff } from '@gonasi/utils/roleFunctions';

import { PlainAvatar, UserAvatar } from '../avatars';
import { NotFoundCard } from '../cards';
import { ProfileDropdown } from '../profile-dropdown';
import { SideLink } from './side-link';

import type {
  UserActiveCompanyLoaderReturnType,
  UserProfileLoaderReturnType,
  UserRoleLoaderReturnType,
} from '~/root';

interface Props {
  role: UserRoleLoaderReturnType;
  activeCompany: UserActiveCompanyLoaderReturnType;
  user: UserProfileLoaderReturnType;
}

export function GoSidebar({ user, role, activeCompany }: Props) {
  const location = useLocation();

  if (!activeCompany) return <NotFoundCard message='No active company found' />;

  const { company_id: companyId } = activeCompany;

  return (
    <aside className='border-r-card sticky top-16 h-full min-h-screen flex-none border-r md:top-20'>
      <div className='mb-10 py-2 pr-0 md:py-8 md:pr-10'>
        <div className='flex flex-col items-start space-x-4 py-4 lg:flex-row lg:items-center'>
          <NavLink to='/'>
            <ChevronLeft size={36} />
          </NavLink>
          <NavLink
            to='/dashboard/change-team'
            state={{ from: location.pathname }}
            className='bg-card/10 hover:bg-primary/5 w-full rounded-lg p-2'
          >
            <div>
              <div className='hidden items-center justify-between md:flex'>
                <UserAvatar
                  username={activeCompany?.profiles.username ?? ''}
                  imageUrl={activeCompany?.profiles.avatar_url}
                  fullName={activeCompany?.profiles.full_name}
                />
                <ChevronsUpDown className='text-muted-foreground' />
              </div>
              <div className='flex md:hidden'>
                <PlainAvatar
                  username={activeCompany?.profiles.username ?? ''}
                  imageUrl={activeCompany?.profiles.avatar_url}
                />
              </div>
            </div>
          </NavLink>
        </div>

        {isGoSuOrGoAdminOrGoStaff(role) && (
          <SideLink
            to='/go-admin/course-categories'
            name='GO - Course Categories'
            icon={<TableOfContents />}
            end
          />
        )}

        {isGoSuOrGoAdmin(role) && (
          <SideLink
            to='/go-admin/lesson-types'
            name='GO - Lesson Types'
            icon={<BookOpenCheck />}
            end
          />
        )}

        <SideLink to={`/dashboard/${companyId}`} name='Dashboard' icon={<LayoutDashboard />} end />
        <SideLink
          to={`/dashboard/${companyId}/resource-center`}
          name='Required Learning'
          icon={<ClipboardCheck />}
          end
        />
        <SideLink
          to={`/dashboard/${companyId}/resource-center/catalog`}
          name='Course Catalog'
          icon={<BookOpen />}
          end
        />

        {(activeCompany?.staff_role === 'su' || activeCompany?.staff_role === 'admin') && (
          <>
            <SideLink
              to={`/dashboard/${companyId}/team-management/staff-directory`}
              name='Team Management'
              icon={<UsersRound />}
              isActive={(pathname) =>
                pathname.startsWith(`/dashboard/${companyId}/team-management/`)
              }
            />
            <SideLink
              to={`/dashboard/${companyId}/learning-paths`}
              name='Learning Paths'
              icon={<Group />}
              end
            />
            <SideLink
              to={`/dashboard/${companyId}/courses`}
              name='Course Builder'
              icon={<BookLock />}
              end
            />
            <SideLink
              to={`/dashboard/${companyId}/file-library`}
              name='File Library'
              icon={<FileStack />}
              end
            />
            <SideLink to={`/dashboard/${companyId}/revenue`} name='Revenue' icon={<Coins />} end />
          </>
        )}
      </div>

      <div className='fixed bottom-10 px-3 md:px-6'>
        {user && (
          <ProfileDropdown
            user={user}
            role={role}
            activeCompany={activeCompany}
            dropdownPosition='top'
            dropdownAlign='start'
          />
        )}
      </div>
    </aside>
  );
}
