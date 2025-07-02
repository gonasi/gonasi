import { Check, Crown } from 'lucide-react';

import { PlainAvatar } from '~/components/avatars';
import { Badge } from '~/components/ui/badge';
import { Card } from '~/components/ui/card';
import { cn } from '~/lib/utils';
import type { UserOrganization } from '~/routes/myProfile/organizations/organizations-index';

interface IOrganizationSwitcherCardProps {
  organization: UserOrganization;
  activeOrganizationId: string;
  handleClick: (organizationId: string) => void;
  isLoading: boolean;
  pendingOrganizationId: string;
}

const BADGE_COLOR_MAP: Record<string, string> = {
  owner: 'bg-red-100 text-red-800 border-red-200',
  admin: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  editor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  instructor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  analyst: 'bg-violet-100 text-violet-800 border-violet-200',
  launch: 'bg-orange-100 text-orange-800 border-orange-200',
  impact: 'bg-green-100 text-green-800 border-green-200',
  scale: 'bg-blue-100 text-blue-800 border-blue-200',
  enterprise: 'bg-purple-100 text-purple-800 border-purple-200',
};

export const getBadgeColorClass = (key: string) =>
  BADGE_COLOR_MAP[key] ?? 'bg-gray-100 text-gray-800 border-gray-200';

export default function OrganizationSwitcherCard({
  organization,
  activeOrganizationId,
  handleClick,
  isLoading,
  pendingOrganizationId,
}: IOrganizationSwitcherCardProps) {
  const {
    is_owner,
    role,
    organization: { id: orgId, name: orgName, handle: orgHandle, avatar_url, tier },
  } = organization;

  const isActive = activeOrganizationId === orgId;
  const isPending = isLoading && pendingOrganizationId === orgId;

  return (
    <Card
      className={cn(
        'flex flex-row items-center gap-2 rounded-lg border p-4 transition-colors duration-200 ease-in-out',
        'bg-card/60',
        isPending && 'opacity-80',
        isActive
          ? 'border-primary/20 bg-card cursor-default hover:cursor-not-allowed'
          : 'border-card hover:border-muted-foreground/20 hover:bg-muted/50 cursor-pointer',
      )}
      onClick={() => {
        if (!isActive && !isPending) handleClick(orgId);
      }}
    >
      <PlainAvatar
        username={orgName}
        imageUrl={avatar_url}
        isActive={isActive}
        isPending={isPending}
      />

      <div className='min-w-0 flex-1'>
        <div className='mb-1 flex items-center gap-2'>
          <h3 className='truncate text-base font-semibold'>{orgName}</h3>
          {is_owner && <Crown className='text-primary h-4 w-4' />}
        </div>
        <p className='text-muted-foreground mb-2 text-sm'>@{orgHandle}</p>
        <div className='flex items-center gap-2'>
          <Badge variant='outline' className={cn('rounded-full text-xs', getBadgeColorClass(role))}>
            {role}
          </Badge>
          <Badge variant='outline' className={cn('rounded-full text-xs', getBadgeColorClass(tier))}>
            {tier}
          </Badge>
        </div>
      </div>

      {isActive && (
        <div className='text-primary flex items-center gap-2'>
          <Check className='h-5 w-5' />
          <span className='hidden text-sm font-medium sm:block'>Current</span>
        </div>
      )}
    </Card>
  );
}
