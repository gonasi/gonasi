import { Check, CircleOff, Crown } from 'lucide-react';

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
  owner:
    'bg-red-200 text-red-900 border-red-300 dark:bg-red-900 dark:text-red-100 dark:border-red-700',
  admin:
    'bg-violet-200 text-violet-900 border-violet-300 dark:bg-violet-900 dark:text-violet-100 dark:border-violet-700',
  editor:
    'bg-emerald-200 text-emerald-900 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-100 dark:border-emerald-700',
  temp: 'bg-orange-200 text-orange-900 border-orange-300 dark:bg-orange-900 dark:text-orange-100 dark:border-orange-700',
  launch:
    'bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-700',
  impact:
    'bg-green-200 text-green-900 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700',
  scale:
    'bg-blue-200 text-blue-900 border-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700',
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
  if (!organization.organization) return null;

  const {
    is_owner,
    role,
    organization: { id: orgId, name: orgName, handle: orgHandle, avatar_url, subscription },
  } = organization;

  const tier = subscription?.tier ?? 'launch'; // or whatever fallback you want

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
            {tier === 'temp' && <CircleOff />}
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
