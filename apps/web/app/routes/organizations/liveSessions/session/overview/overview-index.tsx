import { NavLink, Outlet } from 'react-router';
import { motion } from 'framer-motion';
import { Edit, Globe, History, Lock, Settings, Trash2, Users } from 'lucide-react';
import { redirectWithError } from 'remix-toast';

import { fetchLiveSessionById } from '@gonasi/database/liveSessions';
import { timeAgo } from '@gonasi/utils/timeAgo';

import type { Route } from './+types/overview-index';

import { CourseThumbnail } from '~/components/course';
import { Badge } from '~/components/ui/badge';
import { IconNavLink } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { createClient } from '~/lib/supabase/supabase.server';

export function meta() {
  return [
    { title: 'Session Overview • Gonasi' },
    {
      name: 'description',
      content: 'View and edit session metadata.',
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const sessionId = params.sessionId ?? '';

  const [session, canEditResult] = await Promise.all([
    fetchLiveSessionById({ supabase, sessionId }),
    supabase.rpc('can_user_edit_live_session', { arg_session_id: sessionId }),
  ]);

  if (!session) {
    return redirectWithError(`/${params.organizationId}/live-sessions`, 'Session not found.');
  }

  return {
    session,
    canEdit: canEditResult.data ?? false,
  };
}

const fadeInUp = {
  hidden: { opacity: 0, y: 2 },
  visible: { opacity: 1, y: 0 },
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  waiting: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  ended: 'bg-red-100 text-red-800',
};

export default function OverviewIndex({ params, loaderData }: Route.ComponentProps) {
  const { session, canEdit } = loaderData;

  const {
    name,
    description,
    signedUrl,
    blurUrl,
    session_code,
    session_key,
    visibility,
    status,
    max_participants,
    allow_late_join,
    show_leaderboard,
    enable_chat,
    enable_reactions,
    time_limit_per_question,
    scheduled_start_time,
    actual_start_time,
    ended_at,
    updated_at,
    courses: linkedCourse,
  } = session;

  const basePath = `/${params.organizationId}/live-sessions/${params.sessionId}`;

  return (
    <>
      <section>
        <motion.div
          className='flex flex-col space-y-6'
          initial='hidden'
          animate='visible'
          variants={fadeInUp}
          transition={{ duration: 0.3 }}
        >
          {/* Thumbnail + Header */}
          <motion.div
            className='flex flex-col space-y-4 space-x-0 md:flex-row md:space-y-0 md:space-x-8'
            variants={fadeInUp}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className='flex max-w-md items-center justify-center md:max-w-sm'>
              <CourseThumbnail
                key={signedUrl ?? 'no-thumbnail'}
                thumbnail={signedUrl}
                blurUrl={blurUrl}
                name={name}
                editLink={canEdit ? `${basePath}/overview/edit-thumbnail` : undefined}
              />
            </div>

            <div className='flex-1'>
              <div className='flex items-start justify-between'>
                <div>
                  <div className='flex items-center gap-2'>
                    <h2 className='text-lg md:text-2xl'>{name}</h2>
                    <Badge className={statusColors[status]}>{status}</Badge>
                  </div>
                  <p className='font-secondary text-muted-foreground py-2 text-sm'>
                    {description ?? 'No description provided.'}
                  </p>
                </div>

                {canEdit && (
                  <div className='flex gap-2'>
                    <IconNavLink
                      to={`${basePath}/overview/edit-details`}
                      icon={Edit}
                      className='border-border/20 rounded border p-2'
                    />
                    <IconNavLink
                      to={`${basePath}/overview/edit-settings`}
                      icon={Settings}
                      className='border-border/20 rounded border p-2'
                    />
                    <IconNavLink
                      to={`${basePath}/overview/delete`}
                      icon={Trash2}
                      className='text-danger border-border/20 rounded border p-2'
                    />
                  </div>
                )}
              </div>

              <div className='font-secondary text-muted-foreground flex flex-wrap items-center gap-4 text-sm'>
                <div className='flex items-center gap-1'>
                  {visibility === 'public' ? <Globe size={14} /> : <Lock size={14} />}
                  <span className={visibility === 'public' ? 'text-green-600' : 'text-yellow-600'}>
                    {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                  </span>
                </div>
                <div className='flex items-center gap-1'>
                  <Users size={14} />
                  <span>{max_participants ?? 'Unlimited'} participants</span>
                </div>
                <div className='flex items-center gap-1'>
                  <History size={14} />
                  <span>{timeAgo(updated_at)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <Separator />

          {/* Details */}
          <motion.div
            className='space-y-3'
            variants={fadeInUp}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h3 className='text-sm font-semibold'>Details</h3>
            <div className='grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3'>
              <div>
                <p className='text-muted-foreground text-xs'>Session Code</p>
                <p className='font-mono text-sm font-medium'>{session_code}</p>
              </div>

              {visibility === 'private' && session_key && (
                <div>
                  <p className='text-muted-foreground text-xs'>Session Key</p>
                  <p className='font-mono text-sm font-medium'>{'•'.repeat(session_key.length)}</p>
                </div>
              )}

              <div>
                <p className='text-muted-foreground text-xs'>Scheduled Start</p>
                <p className='text-sm'>
                  {scheduled_start_time
                    ? new Date(scheduled_start_time).toLocaleString()
                    : 'Not scheduled'}
                </p>
              </div>

              {actual_start_time && (
                <div>
                  <p className='text-muted-foreground text-xs'>Started At</p>
                  <p className='text-sm'>{new Date(actual_start_time).toLocaleString()}</p>
                </div>
              )}

              {ended_at && (
                <div>
                  <p className='text-muted-foreground text-xs'>Ended At</p>
                  <p className='text-sm'>{new Date(ended_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          </motion.div>

          <Separator />

          {/* Configuration */}
          <motion.div
            className='space-y-3'
            variants={fadeInUp}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <h3 className='text-sm font-semibold'>Configuration</h3>
            <div className='grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3'>
              <div>
                <p className='text-muted-foreground text-xs'>Max Participants</p>
                <p className='text-sm'>{max_participants ?? 'Unlimited'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Time Limit</p>
                <p className='text-sm'>
                  {time_limit_per_question ? `${time_limit_per_question}s` : 'No limit'}
                </p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Late Join</p>
                <p className='text-sm'>{allow_late_join ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Leaderboard</p>
                <p className='text-sm'>{show_leaderboard ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Chat</p>
                <p className='text-sm'>{enable_chat ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Reactions</p>
                <p className='text-sm'>{enable_reactions ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
          </motion.div>

          {/* Linked Course */}
          {linkedCourse && (
            <>
              <Separator />
              <motion.div
                className='space-y-3'
                variants={fadeInUp}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <h3 className='text-sm font-semibold'>Linked Course</h3>
                <NavLink
                  to={`/${params.organizationId}/courses/${linkedCourse.id}`}
                  className='text-primary text-sm hover:underline'
                >
                  {linkedCourse.name}
                </NavLink>
              </motion.div>
            </>
          )}
        </motion.div>
      </section>

      <Outlet />
    </>
  );
}
