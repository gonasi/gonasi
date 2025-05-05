import { Edit, Phone, Trash } from 'lucide-react';

import { ActionDropdown } from '~/components/action-dropdown';
import { UserAvatar } from '~/components/avatars';
import { NotFoundCard } from '~/components/cards';
import { PaginationBar } from '~/components/search-params/pagination-bar';
import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';
import type { UserProfileLoaderReturnType } from '~/root';
import type { StaffMembersLoaderReturnType } from '~/routes/dashboard/team-management/staff-directory';

interface Props {
  loaderData: StaffMembersLoaderReturnType;
  user: UserProfileLoaderReturnType;
  companyId: string;
}

export function UsersCard({ loaderData, user, companyId }: Props) {
  if (!user) return <NotFoundCard message='User not found' />;

  const { data, count } = loaderData;

  if (!data || data.length === 0) {
    return <NotFoundCard message='No staff members found' />;
  }

  const userOwnsCompany = user.id === companyId;

  // Helper function to determine badge variant
  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'su':
        return 'success';
      case 'admin':
        return 'info';
      default:
        return 'tip';
    }
  };

  return (
    <div className='flex flex-col space-y-4'>
      {data.map((staff) => {
        const isCurrentUser = user.id === staff.staff_profile.id;
        const isSuperUser = staff.staff_role === 'su';

        const roleVariant = getRoleVariant(staff.staff_role);
        const showDropdown = userOwnsCompany && !isSuperUser;

        const options = [
          {
            title: 'Edit Role',
            icon: Edit,
            to: `/dashboard/${companyId}/team-management/staff-directory/edit-role/${staff.staff_id}`,
            disabled: !userOwnsCompany,
          },
          {
            title: 'Remove Staff Member',
            icon: Trash,
            to: `/dashboard/${companyId}/team-management/staff-directory/remove-staff/${staff.staff_id}`,
            disabled: !userOwnsCompany,
          },
        ];

        return (
          <div
            className={cn(
              'bg-card/50 flex w-full flex-col items-start justify-between space-y-4 rounded-xl p-4 shadow-xs md:flex-row md:items-center md:space-y-0',
              'border-t-4',
              {
                'bg-card': isCurrentUser,
                [`border-t-${roleVariant}`]: true,
              },
            )}
            key={staff.id}
          >
            <div className='flex w-full items-center justify-between'>
              <UserAvatar
                username={staff.staff_profile.username}
                fullName={`${staff.staff_profile.full_name}${isCurrentUser ? ' - (ME)' : ''}`}
              />
              <div className='block md:hidden'>
                {showDropdown && <ActionDropdown items={options} />}
              </div>
            </div>

            <div className='flex w-full items-center justify-between space-x-0 md:justify-end md:space-x-4'>
              <div className='flex items-center space-x-1'>
                <Phone size={14} />
                <span className='mt-1'>0{staff.staff_profile.phone_number}</span>
              </div>
              <div className='flex items-center space-x-4'>
                <Badge variant={roleVariant}>{staff.staff_role}</Badge>
              </div>
              <div className='hidden md:block'>
                {showDropdown && <ActionDropdown items={options} />}
              </div>
            </div>
          </div>
        );
      })}

      <PaginationBar totalItems={count ?? 0} itemsPerPage={12} />
    </div>
  );
}
