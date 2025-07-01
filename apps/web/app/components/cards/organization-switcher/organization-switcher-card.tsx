import { Check, Crown } from 'lucide-react';

import { PlainAvatar } from '~/components/avatars';
import { Badge } from '~/components/ui/badge';
import { Card } from '~/components/ui/card';
import { cn } from '~/lib/utils';
import type { UserOrganization } from '~/routes/myProfile/organizations/organizations-index';

interface IOrganizationSwitcherCardProps {
  data: UserOrganization;
  activeOrganizationId: string;
}

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'enterprise':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'scale':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'impact':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'launch':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'owner':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'admin':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'editor':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'instructor':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'analyst':
      return 'bg-violet-100 text-violet-800 border-violet-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function OrganizationSwitcherCard({
  data,
  activeOrganizationId,
}: IOrganizationSwitcherCardProps) {
  const {
    is_owner,
    id,
    role,
    organization_id,
    organization: { id: orgId, name: orgName, handle: orgHandle, avatar_url, blur_hash, tier },
  } = data;

  const isSelected = false;
  return (
    <Card
      className={cn(
        'border-card flex cursor-pointer flex-row items-center gap-4 rounded-lg border p-4 transition-all duration-200 hover:shadow-md',
        isSelected ? 'shadow-sm' : 'hover:bg-muted/50',
      )}
    >
      <PlainAvatar username={orgName} imageUrl={avatar_url} />
      <div className='min-w-0 flex-1'>
        <div className='mb-1 flex items-center gap-2'>
          <h3 className='truncate text-base font-semibold'>{orgName}</h3>
          {is_owner && <Crown className='h-4 w-4 flex-shrink-0 text-yellow-600' />}
        </div>
        <p className='text-muted-foreground mb-2 text-sm'>@{orgHandle}</p>
        <div className='flex items-center gap-2'>
          <Badge variant='outline' className={cn('text-xs', getRoleColor(role))}>
            {role}
          </Badge>
          <Badge variant='outline' className={cn('text-xs', getTierColor(tier))}>
            {tier}
          </Badge>
        </div>
      </div>

      <div className='flex items-center'>
        {activeOrganizationId === orgId && (
          <div className='text-primary flex items-center gap-2'>
            <Check className='h-5 w-5' />
            <span className='text-sm font-medium'>Current</span>
          </div>
        )}
      </div>
    </Card>
  );
}
