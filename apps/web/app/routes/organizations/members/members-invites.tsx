import { Outlet, useOutletContext } from 'react-router';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Plus, RotateCcw, Trash, X } from 'lucide-react';

import { fetchOrganizationInvites } from '@gonasi/database/organizations';

import type { Route } from './+types/members-invites';

import { BannerCard } from '~/components/cards';
import { Button, IconNavLink } from '~/components/ui/button';
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

  const onResend = (id: string) => {
    console.log('[Resend Invite]', id);
    // TODO: trigger resend via Supabase function or API route
  };

  const onRevoke = (id: string) => {
    console.log('[Revoke Invite]', id);
    // TODO: update `revoked_at` via Supabase
  };

  const onDelete = (id: string) => {
    console.log('[Delete Invite]', id);
    // TODO: delete row via Supabase
  };

  return (
    <>
      <div className='px-4 pb-8'>
        <BannerCard
          message='message here'
          description='hello there'
          showCloseIcon={false}
          variant='warning'
        />
      </div>
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
                pending: 'not sent',
                sent: 'sent',
                failed: 'failed',
              }[invite.delivery_status];

              const isExpired = new Date(invite.expires_at) < new Date();

              const status = invite.revoked_at
                ? 'Revoked'
                : invite.accepted_at
                  ? 'Accepted'
                  : isExpired
                    ? 'Expired'
                    : `Pending (${deliveryLabel})`;

              const lastSent = formatDistanceToNow(new Date(invite.last_sent_at), {
                addSuffix: true,
              });

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
                  <TableCell className='capitalize'>{status}</TableCell>
                  <TableCell className='text-muted-foreground text-sm'>{lastSent}</TableCell>

                  <TableCell className='flex justify-end gap-2'>
                    {status.startsWith('Pending') && (
                      <>
                        <Button size='icon' variant='ghost' onClick={() => onResend(invite.id)}>
                          <RotateCcw className='h-4 w-4' />
                        </Button>
                        <Button size='icon' variant='ghost' onClick={() => onRevoke(invite.id)}>
                          <X className='h-4 w-4' />
                        </Button>
                      </>
                    )}
                    {status === 'Revoked' && (
                      <Button size='icon' variant='ghost' onClick={() => onDelete(invite.id)}>
                        <Trash className='text-destructive h-4 w-4' />
                      </Button>
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
