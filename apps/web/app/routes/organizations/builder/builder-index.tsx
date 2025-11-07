import { NavLink, Outlet } from 'react-router';
import { motion } from 'framer-motion';
import { Pencil, PenOff, Plus } from 'lucide-react';

import { fetchOrganizationCourses } from '@gonasi/database/courses';

import type { Route } from './+types/builder-index';

import { PlainAvatar } from '~/components/avatars/plain-avatar';
import { NotFoundCard } from '~/components/cards';
import { GoCardContent, GoCourseHeader, GoThumbnail } from '~/components/cards/go-course-card';
import { Badge } from '~/components/ui/badge';
import { IconNavLink } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/supabase.server';
import { cn } from '~/lib/utils';

// Metadata for SEO
export function meta() {
  return [
    {
      title: 'Organization Courses • Gonasi',
    },
    {
      name: 'description',
      content:
        'Manage and view all courses created by your organization on Gonasi. This view is only visible to organization members.',
    },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createClient(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('name') ?? '';
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = 12;

  const courses = await fetchOrganizationCourses({
    supabase,
    searchQuery: search,
    limit,
    page,
    organizationId: params.organizationId ?? '',
  });

  console.log('courses: ', JSON.stringify(courses, null, 2));

  return { courses };
}

export default function BuilderIndex({ params, loaderData }: Route.ComponentProps) {
  const {
    courses: { data },
  } = loaderData;

  const fadeInUp = {
    hidden: { opacity: 0, y: 2 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <div className='mx-auto pt-4'>
        <div className='flex items-center justify-between px-4'>
          <h2 className='text-lg md:text-2xl'>Manage Courses</h2>
          <IconNavLink
            to={`/${params.organizationId}/builder/new-course-title`}
            icon={Plus}
            className='rounded-lg border p-2'
          />
        </div>
        <section className='px-0 py-4 md:px-4'>
          {data && data.length ? (
            <div className='grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-4 lg:grid-cols-3'>
              {data.map(({ id, name, signed_url, blur_hash, canEdit, editors }, index) => {
                const dispBadges = (
                  <div className='flex items-center gap-2'>
                    {/* Badge */}
                    {canEdit ? (
                      <Badge variant='default' className='p-1 opacity-50'>
                        <Pencil />
                      </Badge>
                    ) : (
                      <Badge variant='secondary' className='p-1 opacity-50'>
                        <PenOff />
                      </Badge>
                    )}

                    {/* Avatars */}
                    <div className='*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale'>
                      {editors.map((editor) => (
                        <PlainAvatar
                          key={editor.id}
                          username={editor.username}
                          imageUrl={editor.avatar_signed_url ?? ''}
                          size='sm'
                          showTooltip
                        />
                      ))}
                    </div>
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
                      to={`/${params.organizationId}/builder/${id}`}
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
                            blurHash={blur_hash}
                            name={name}
                            className='rounded-t-none'
                            badges={[dispBadges]}
                          />
                          <GoCardContent>
                            <GoCourseHeader className='line-clamp-1 text-sm' name={name} />
                          </GoCardContent>
                        </div>
                      )}
                    </NavLink>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className='max-w-md'>
              <NotFoundCard message='No courses found' />
            </div>
          )}
        </section>
      </div>
      <Outlet />
    </>
  );
}
