import { NavLink, Outlet } from 'react-router';
import { motion } from 'framer-motion';
import { Pencil, PenOff, Plus } from 'lucide-react';

import { fetchOrganizationLiveSessions } from '@gonasi/database/liveSessions';

import type { Route } from './+types/live-sessions-index';

import { PlainAvatar } from '~/components/avatars/plain-avatar';
import { NotFoundCard } from '~/components/cards';
import { GoCardContent, GoCourseHeader, GoThumbnail } from '~/components/cards/go-course-card';
import { Badge } from '~/components/ui/badge';
import { IconNavLink } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';

export function meta() {
  return [
    { title: 'Live Sessions • Gonasi' },
    {
      name: 'description',
      content: 'Manage and view all live sessions created by your organization on Gonasi.',
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('name') ?? '';
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = 12;

  const sessions = await fetchOrganizationLiveSessions({
    supabase,
    searchQuery: search,
    limit,
    page,
    organizationId: params.organizationId ?? '',
  });

  return { sessions };
}

export default function LiveSessionsIndex({ params, loaderData }: Route.ComponentProps) {
  const {
    sessions: { data },
  } = loaderData;

  const fadeInUp = {
    hidden: { opacity: 0, y: 2 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <div className='mx-auto pt-4'>
        <div className='flex items-center justify-between px-4'>
          <h2 className='text-lg md:text-2xl'>Live Sessions</h2>
          <IconNavLink
            to={`/${params.organizationId}/live-sessions/new`}
            icon={Plus}
            className='rounded-lg border p-2'
          />
        </div>

        <section className='px-0 py-4 md:px-4'>
          {data && data.length ? (
            <div className='grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-4 lg:grid-cols-3'>
              {data.map(
                (
                  { id, name, signed_url, status, session_code, canEdit, editors, userId },
                  index,
                ) => {
                  const badges = (
                    <div className='flex items-center gap-2'>
                      <Badge variant={canEdit ? 'default' : 'secondary'} className='p-1 opacity-50'>
                        {canEdit ? <Pencil /> : <PenOff />}
                      </Badge>

                      <div className='*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale'>
                        {editors.map((editor) => (
                          <PlainAvatar
                            key={editor.id}
                            username={editor.username}
                            imageUrl={editor.avatar_signed_url ?? ''}
                            size='sm'
                            showTooltip
                            isActive={userId === editor.id}
                          />
                        ))}
                      </div>

                      <Badge variant='secondary' className='p-1 opacity-50'>
                        {status}
                      </Badge>
                    </div>
                  );

                  return (
                    <motion.div
                      key={id}
                      variants={fadeInUp}
                      initial='hidden'
                      animate='visible'
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <NavLink
                        to={`/${params.organizationId}/live-sessions/${id}`}
                        className={cn('pb-4 hover:cursor-pointer md:pb-0')}
                      >
                        {({ isPending }) => (
                          <div
                            className={cn(
                              'group md:bg-card/80 m-0 rounded-none border-none bg-transparent p-0 shadow-none',
                              isPending && 'bg-primary/5',
                            )}
                          >
                            <GoThumbnail
                              iconUrl={signed_url}
                              name={name}
                              className='rounded-t-none'
                              badges={[badges]}
                            />
                            <GoCardContent>
                              <GoCourseHeader className='line-clamp-1 text-sm' name={name} />
                              <p className='text-muted-foreground text-xs'>{session_code}</p>
                            </GoCardContent>
                          </div>
                        )}
                      </NavLink>
                    </motion.div>
                  );
                },
              )}
            </div>
          ) : (
            <div className='max-w-md'>
              <NotFoundCard message='No live sessions found. Create one to get started.' />
            </div>
          )}
        </section>
      </div>

      <Outlet />
    </>
  );
}
