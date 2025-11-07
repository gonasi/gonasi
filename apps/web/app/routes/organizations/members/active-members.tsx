import { Outlet, useOutletContext } from 'react-router';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { UserRoundPen, X } from 'lucide-react';
import { redirectWithError } from 'remix-toast';

import { fetchOrganizationMembers, getUserOrgRole } from '@gonasi/database/organizations';

import type { Route } from './+types/active-members';

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
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
  const { organizationId } = params;

  const [members, userOrgRole] = await Promise.all([
    fetchOrganizationMembers({ supabase, organizationId }),
    getUserOrgRole({ supabase, organizationId }),
  ]);

  // Block editor and null (non-members)
  if (userOrgRole === 'editor' || userOrgRole === null) {
    return redirectWithError(
      `/${organizationId}/builder`,
      'You are not authorized to view this page.',
    );
  }

  return members;
}

export default function ActiveMembers({ params, loaderData }: Route.ComponentProps) {
  const { data } = useOutletContext<OrganizationsOutletContextType>();
  const members = loaderData ?? [];

  const isEditor = data.member.role === 'editor';

  const canDelete = (
    currentUserRole: 'owner' | 'admin' | 'editor',
    targetRole: 'owner' | 'admin' | 'editor',
    currentUserId: string,
    targetUserId: string,
  ) => {
    if (currentUserId === targetUserId) return false;
    if (currentUserRole === 'owner') return true;
    if (currentUserRole === 'admin' && targetRole === 'editor') return true;
    return false;
  };

  return (
    <>
      <div className='px-0 py-4 md:px-4'>
        <h2 className='mb-4 text-lg md:text-2xl'>Active Members</h2>

        {members.length === 0 ? (
          <p className='text-muted-foreground'>There are no active members yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-1/3'>Member</TableHead>
                <TableHead>Role</TableHead>
                {!isEditor && <TableHead>Invited By</TableHead>}
                {!isEditor && <TableHead>Joined</TableHead>}
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody className='font-secondary'>
              {members.map((member) => {
                const profile = member.user;
                const displayName = profile.full_name ?? profile.username ?? 'Unknown';
                const emailDisplay = profile.phone_number ?? profile.username ?? '';
                const invitedBy =
                  member.invited_by?.full_name ?? member.invited_by?.username ?? '—';

                const joinedAgo = formatDistanceToNow(new Date(member.membership_created_at), {
                  addSuffix: true,
                });

                const roleColor =
                  {
                    owner: 'bg-purple-100 text-purple-800',
                    admin: 'bg-blue-100 text-blue-800',
                    editor: 'bg-yellow-100 text-yellow-800',
                  }[member.role] ?? 'bg-muted text-foreground';

                const showDelete = canDelete(
                  data.member.role,
                  member.role,
                  data.member.user_id,
                  profile.id,
                );

                const showEdit = data.member.role === 'owner' && profile.id !== data.member.user_id;

                return (
                  <motion.tr
                    key={member.membership_id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className='hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors'
                  >
                    <TableCell className='flex items-center gap-3 py-4'>
                      <Avatar className='h-8 w-8'>
                        <AvatarImage src={profile.avatar_url ?? ''} alt={displayName} />
                        <AvatarFallback>
                          {profile.full_name?.[0] ?? profile.username?.[0] ?? 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className='space-y-0.5'>
                        <p className='text-sm leading-none font-medium'>{displayName}</p>
                        <p className='text-muted-foreground text-xs'>{emailDisplay}</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge className={roleColor}>{member.role}</Badge>
                    </TableCell>

                    {!isEditor && (
                      <TableCell className='text-muted-foreground text-sm'>{invitedBy}</TableCell>
                    )}

                    {!isEditor && (
                      <TableCell className='text-muted-foreground text-sm'>{joinedAgo}</TableCell>
                    )}

                    <TableCell className='flex items-center space-x-4 text-right'>
                      {showEdit && (
                        <div>
                          <IconNavLink
                            to={`/${params.organizationId}/members/active-members/${member.membership_id}/edit-role`}
                            icon={UserRoundPen}
                          />
                        </div>
                      )}
                      {showDelete && (
                        <div>
                          <IconNavLink
                            to={`/${params.organizationId}/members/active-members/${member.membership_id}/delete`}
                            icon={X}
                          />
                        </div>
                      )}
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      <Outlet />
    </>
  );
}
