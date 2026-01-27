import { Outlet } from 'react-router';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Dot, Plus, RotateCcw, X } from 'lucide-react';
import { redirectWithError } from 'remix-toast';

import { fetchCourseInvites } from '@gonasi/database/courseInvites';
import { fetchOrgTierLimits, getUserOrgRole } from '@gonasi/database/organizations';
import { fetchPublishedCourseById } from '@gonasi/database/publishedCourses';

import type { Route } from './+types/invites-index';

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

export function meta() {
  return [
    { title: 'Invites • Gonasi' },
    { name: 'description', content: 'Manage learner invitations for this course' },
  ];
}

export type CourseInvitesPageLoaderData = Exclude<Awaited<ReturnType<typeof loader>>, Response>;

export async function loader({ params, request }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const { organizationId, courseId } = params;

  if (!courseId) {
    return redirectWithError(
      `/${organizationId}/builder`,
      'Course ID is required to view invites.',
    );
  }

  // Get user role for authorization
  const role = await getUserOrgRole({ supabase, organizationId });

  if (!role || role === 'editor') {
    return redirectWithError(
      `/${organizationId}/builder/${courseId}/published`,
      'You are not allowed to view this page.',
    );
  }

  const [publishedCourse, invites, tierLimits] = await Promise.all([
    fetchPublishedCourseById({ supabase, courseId }),
    fetchCourseInvites({ supabase, publishedCourseId: courseId }),
    fetchOrgTierLimits({ supabase, organizationId }),
  ]);

  if (!publishedCourse) {
    return redirectWithError(
      `/${organizationId}/builder/${courseId}/published`,
      'Course not found or not published.',
    );
  }

  const canSendInvite = await determineCanSendInvite(tierLimits, publishedCourse);

  // Check if course is private (only private courses need email invitations)
  const isPrivateCourse = publishedCourse.visibility === 'private';
  const visibility = publishedCourse.visibility;
  const visibilityLabel =
    visibility === 'public' ? 'Public' : visibility === 'unlisted' ? 'Unlisted' : 'Private';

  return {
    invites: invites ?? [],
    tierLimits,
    publishedCourse,
    canSendInvite,
    role,
    isPrivateCourse,
    visibility,
    visibilityLabel,
  };
}

/**
 * Determines if the organization can send invites based on:
 * - temp tier: Cannot send invites
 * - launch tier: Can only send invites for PAID courses
 * - scale/impact tiers: Can send invites for any course
 */
async function determineCanSendInvite(
  tierLimits: Awaited<ReturnType<typeof fetchOrgTierLimits>>,
  publishedCourse: NonNullable<Awaited<ReturnType<typeof fetchPublishedCourseById>>>,
) {
  if (!tierLimits) return { allowed: false, reason: 'Unable to verify your subscription tier.' };

  const { tier } = tierLimits;
  const isFree = publishedCourse.has_free_tier;

  // temp tier can't send invites
  if (tier === 'temp') {
    return {
      allowed: false,
      reason: 'The Temp tier does not support sending course invites. Please upgrade your plan.',
    };
  }

  // launch tier can't send invites for free courses
  if (tier === 'launch' && isFree) {
    return {
      allowed: false,
      reason:
        'The current published version is not a paid course. Launch tier only allows invites for paid courses. Upgrade to Scale or Impact to send invites for free courses.',
    };
  }

  return { allowed: true, reason: null };
}

export default function InvitesIndex({ params, loaderData }: Route.ComponentProps) {
  const { invites, canSendInvite, tierLimits, visibility, visibilityLabel } = loaderData;

  // Only show banner for public or unlisted courses
  const shouldShowVisibilityBanner = visibility === 'public' || visibility === 'unlisted';

  return (
    <>
      {shouldShowVisibilityBanner && (
        <div className='px-0 pb-8 md:px-4'>
          <h1>{visibility}</h1>
          <BannerCard
            message={`Email invitations not needed for the published ${visibilityLabel} course`}
            description={`The currently published version of this course is set to ${visibilityLabel}, so ${
              visibility === 'public'
                ? 'it’s visible and searchable by anyone'
                : 'anyone with the course link can access it'
            }. If you change this course to Private, you’ll need to publish your changes for them to take effect. Email invitations are only required for Private courses.`}
            showCloseIcon={false}
            variant='tip'
            cta={{
              to: `/${params.organizationId}/builder/${params.courseId}/overview/edit-details?redirectTo=/${params.organizationId}/builder/${params.courseId}/learners/invites`,
              children: 'Change to private',
            }}
          />
        </div>
      )}

      {!canSendInvite.allowed && visibility === 'private' && (
        <div className='px-0 pb-8 md:px-4'>
          <BannerCard
            message={`Course invites not available on the ${tierLimits?.tier} plan`}
            description={`Course invites are disabled for the currently published version of this course on the ${tierLimits?.tier} plan. If you upgrade your plan, you’ll need to publish your changes for course invites to become available.`}
            showCloseIcon={false}
            variant='warning'
            cta={{
              to: `/${params.organizationId}/dashboard/subscriptions`,
              children: 'Upgrade your plan',
            }}
          />
        </div>
      )}

      <div className='flex items-center justify-between px-0 md:px-4'>
        <h2 className='text-lg md:text-2xl'>Course Invites</h2>
        <IconNavLink
          to={`/${params.organizationId}/builder/${params.courseId}/learners/invites/new-invite`}
          icon={Plus}
          aria-disabled={!canSendInvite.allowed || visibility !== 'private'}
          className={clsx(
            'rounded-lg border p-2',
            !canSendInvite.allowed || visibility !== 'private'
              ? 'pointer-events-none cursor-not-allowed opacity-50'
              : 'cursor-pointer',
          )}
        />
      </div>

      <div className='px-0 py-4 md:px-4'>
        {invites.length === 0 ? (
          <div className='border-muted text-muted-foreground flex flex-col items-center justify-center rounded-lg border py-12'>
            <p className='text-sm'>No invites sent yet</p>
            {canSendInvite.allowed && visibility === 'private' && (
              <p className='text-xs'>Click the + button above to send your first invite</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Pricing Tier</TableHead>
                <TableHead>Cohort</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sent</TableHead>
                <TableHead className='w-[150px]' />
              </TableRow>
            </TableHeader>
            <TableBody className='font-secondary'>
              {invites.map((invite) => {
                const deliveryLabel = {
                  pending: 'Not Sent',
                  sent: 'Sent',
                  failed: 'Failed',
                }[invite.delivery_status];

                const isExpired = new Date(invite.expires_at) < new Date();
                const isTierDeleted = invite.revoked_at && !invite.pricing_tier_id;

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
                    <TableCell className='text-muted-foreground text-sm'>
                      {invite.course_pricing_tiers ? (
                        <div className='flex flex-col gap-0.5'>
                          <div className='text-foreground font-medium'>
                            {invite.course_pricing_tiers.tier_name || 'Standard'}
                          </div>
                          <div className='text-xs'>
                            {invite.course_pricing_tiers.is_free
                              ? 'Free'
                              : `${invite.course_pricing_tiers.currency_code} ${Number(
                                  invite.course_pricing_tiers.price,
                                ).toLocaleString()} / ${invite.course_pricing_tiers.payment_frequency}`}
                          </div>
                        </div>
                      ) : (
                        <span className='text-destructive text-xs'>Tier deleted</span>
                      )}
                    </TableCell>
                    <TableCell className='text-muted-foreground text-sm'>
                      {invite.cohorts?.name ?? 'No cohort'}
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-1'>
                        <Badge className={statusColor}>{status}</Badge>
                        {status === 'Pending' && (
                          <span className='text-muted-foreground text-xs'>
                            Email: {deliveryLabel}
                          </span>
                        )}
                        {isTierDeleted && status === 'Revoked' && (
                          <span className='text-destructive text-xs'>Tier was deleted</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground text-sm'>{lastSent}</TableCell>
                    <TableCell className='flex h-full items-center justify-end gap-4 py-4'>
                      {status === 'Pending' ? (
                        <>
                          <div>
                            <IconNavLink
                              to={`/${params.organizationId}/builder/${params.courseId}/learners/invites/resend/${invite.id}/${invite.token}`}
                              icon={RotateCcw}
                              size={20}
                            />
                          </div>
                          <div>
                            <IconNavLink
                              to={`/${params.organizationId}/builder/${params.courseId}/learners/invites/revoke/${invite.id}/${invite.token}`}
                              icon={X}
                              size={20}
                            />
                          </div>
                        </>
                      ) : (
                        <div>
                          <Dot size={20} />
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
      <Outlet context={{ ...loaderData }} />
    </>
  );
}
