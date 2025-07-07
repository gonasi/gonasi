import { Outlet, useOutletContext } from 'react-router';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Plus, RotateCcw, X } from 'lucide-react';

import { fetchOrganizationInvites } from '@gonasi/database/organizations';

import type { Route } from './+types/members-invites';

import { BannerCard } from '~/components/cards';
import { Badge } from '~/components/ui/badge';
import { IconNavLink } from '~/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { createClient } from '~/lib/supabase/supabase.server';
import type { OrganizationsOutletContextType } from '~/routes/layouts/organizations/organizations-layout';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);

  const invites = await fetchOrganizationInvites({
    supabase,
    organizationId: params.organizationId,
  });

  return invites;
}

export default function MembersInvites({ params, loaderData }: Route.ComponentProps) {
  const { data } = useOutletContext<OrganizationsOutletContextType>();

  return (
    <>
      {data.permissions.can_accept_new_member ? null : (
        <div className='px-4 pb-8'>
          <BannerCard
            message={`You're at the limit for the ${data.tier_limits.tier} plan`}
            description={`Your current plan allows up to ${data.tier_limits.max_members_per_org} members per organization. Need more room? Consider upgrading your plan.`}
            showCloseIcon={false}
            variant='warning'
          />
        </div>
      )}

      <div className='flex items-center justify-between px-0 md:px-4'>
        <h2 className='text-lg md:text-2xl'>Member Invites</h2>
        <IconNavLink
          to={`/${params.organizationId}/members/invites/new-invite`}
          icon={Plus}
          className='rounded-lg border p-2'
        />
      </div>
      <div className='px-0 py-4 md:px-4'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Sent</TableHead>
              <TableHead className='w-[150px]' />
            </TableRow>
          </TableHeader>
          <TableBody className='font-secondary'>
            {loaderData?.map((invite) => {
              const deliveryLabel = {
                pending: 'Not Sent',
                sent: 'Sent',
                failed: 'Failed',
              }[invite.delivery_status];

              const isExpired = new Date(invite.expires_at) < new Date();

              const status = invite.revoked_at
                ? 'Revoked'
                : invite.accepted_at
                  ? 'Accepted'
                  : isExpired
                    ? 'Expired'
                    : 'Pending';

              const lastSent = formatDistanceToNow(new Date(invite.last_sent_at), {
                addSuffix: true,
              });

              const statusColor =
                {
                  Pending: 'bg-yellow-100 text-yellow-800',
                  Accepted: 'bg-green-100 text-green-800',
                  Expired: 'bg-gray-200 text-gray-700',
                  Revoked: 'bg-red-100 text-red-800',
                }[status] ?? 'bg-muted text-foreground';

              return (
                <motion.tr
                  key={invite.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className='hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors'
                >
                  <TableCell>{invite.email}</TableCell>
                  <TableCell className='capitalize'>{invite.role}</TableCell>
                  <TableCell>
                    <div className='flex flex-col gap-1'>
                      <Badge className={statusColor}>{status}</Badge>
                      {status === 'Pending' && (
                        <span className='text-muted-foreground text-xs'>
                          Email: {deliveryLabel}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className='text-muted-foreground text-sm'>{lastSent}</TableCell>
                  <TableCell className='flex h-full items-center justify-end gap-4 py-4'>
                    {status === 'Pending' && (
                      <>
                        <div>
                          <IconNavLink
                            to={`/${params.organizationId}/members/invites/resend/${invite.id}/${invite.token}`}
                            icon={RotateCcw}
                            size={20}
                          />
                        </div>
                        <div>
                          <IconNavLink
                            to={`/${params.organizationId}/members/invites/revoke/${invite.id}/${invite.token}`}
                            icon={X}
                            size={20}
                          />
                        </div>
                      </>
                    )}
                  </TableCell>
                </motion.tr>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Outlet context={{ data }} />
    </>
  );
}
